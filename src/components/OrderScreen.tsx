import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Animated,
    Easing,
    RefreshControl,
    Modal,
    PanResponder,
} from 'react-native';
import { useNavigation, useFocusEffect, DrawerActions } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NetInfo from '@react-native-community/netinfo';
import { useAppDispatch, useAppSelector } from '../store/store';
import { Color } from '../theme';
import {
    fetchOrderStats,
    fetchOrders,
    loadCachedOrders,
    updateOrderStatus,
    clearError,
    Order
} from '../store/slices/orderSlice';

const { width, height } = Dimensions.get('window');

// --- Loading Overlay with Order Theme ---
const LoadingOverlay = ({ isConnected }: { isConnected: boolean | null }) => (
    <View style={styles.loadingOverlay}>
        <View style={styles.loadingContent}>
            {/* Order-themed icon */}
            <View style={styles.orderIconContainer}>
                <Icon name="receipt" size={48} color={Color.primary} />
                <View style={styles.iconPulse} />
            </View>
            <Text style={styles.loadingText}>Loading Orders</Text>
            <Text style={styles.loadingSubtext}>
                {isConnected === false ? 'Offline - loading cached data' : 'Preparing your orders...'}
            </Text>
            <ActivityIndicator size="large" color={Color.primary} style={styles.loadingSpinner} />
        </View>
    </View>
);

const OrderScreen = () => {
    const navigation = useNavigation();
    const dispatch = useAppDispatch();

    // Get data from Redux store
    const {
        orders,
        orderStats,
        loading,
        error,
        totalPages,
        currentPage,
        totalElements,
        pageSize
    } = useAppSelector(state => state.order);

    const [selectedFilter, setSelectedFilter] = useState('All');
    const [localCurrentPage, setLocalCurrentPage] = useState(0);
    const [pageSizeLocal] = useState(4);
    const [isInitialLoad, setIsInitialLoad] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isConnected, setIsConnected] = useState<boolean | null>(null);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle');
    const [showLoadingOverlay, setShowLoadingOverlay] = useState(true);

    // Modal state
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

    // Animation values for dashboard reveal effect
    const [fadeAnim] = useState(new Animated.Value(0));
    const [scaleAnim] = useState(new Animated.Value(0.8));
    const [cardAnimations] = useState(
        Array(4).fill(0).map(() => new Animated.Value(0))
    );
    const [statsAnim] = useState(new Animated.Value(0));

    // Modal animation
    const modalAnim = useRef(new Animated.Value(0)).current;
    const backdropAnim = useRef(new Animated.Value(0)).current;

    const statusColors = {
        SCHEDULED: '#3B82F6',
        CONFIRMED: '#10B981',
        IN_PROGRESS: '#F59E0B',
        COMPLETED: '#10B981',
        CANCELLED: '#6B7280',
        REQUESTED: '#8B5CF6',
    };

    const herdTypeColors = {
        BULLS: '#EF4444',
        COWS: '#8B5CF6',
        CALVES: '#F59E0B',
        MIXED: '#6B7280',
    };

    const sourceColors = {
        MANAGER: '#3B82F6',
        TELEPHONE_CUSTOMER: '#10B981',
        WEB_CUSTOMER: '#8B5CF6',
    };

    const filterOptions = ['All', 'Scheduled', 'In Progress', 'Completed'];

    // Pan responder for swipe to close modal
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (evt, gestureState) => {
                if (gestureState.dy > 0) {
                    modalAnim.setValue(gestureState.dy);
                }
            },
            onPanResponderRelease: (evt, gestureState) => {
                if (gestureState.dy > 100) {
                    closeOrderModal();
                } else {
                    Animated.spring(modalAnim, {
                        toValue: 0,
                        useNativeDriver: true,
                    }).start();
                }
            },
        })
    ).current;

    // Open order modal
    const openOrderModal = (order: Order) => {
        setSelectedOrder(order);
        setShowOrderModal(true);
        Animated.parallel([
            Animated.timing(backdropAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }),
            Animated.spring(modalAnim, {
                toValue: 1,
                tension: 60,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    };

    // Close order modal
    const closeOrderModal = () => {
        Animated.parallel([
            Animated.timing(backdropAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(modalAnim, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            setShowOrderModal(false);
            setSelectedOrder(null);
        });
    };

    // Error handling
    useEffect(() => {
        if (error) {
            Alert.alert('Error', error);
            dispatch(clearError());
        }
    }, [error, dispatch]);

    // Network connectivity detection
    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener(state => {
            const connected = state.isConnected ?? false;
            setIsConnected(connected);

            if (connected && isConnected === false && orders.length > 0) {
                handleBackgroundSync();
            }
        });

        return () => unsubscribe();
    }, [isConnected, orders.length]);

    // Optimized data loading strategy with reveal effect
    useFocusEffect(
        useCallback(() => {
            let isActive = true;

            const loadData = async () => {
                try {
                    setShowLoadingOverlay(true);

                    const netState = await NetInfo.fetch();
                    const connected = netState.isConnected ?? false;

                    if (connected) {
                        console.log("🌐 Online - fetching orders...");
                        await Promise.all([
                            dispatch(fetchOrderStats()),
                            dispatch(fetchOrders({ page: 0, size: pageSizeLocal }))
                        ]);
                    } else {
                        console.log("📴 Offline - loading cached orders...");
                        await dispatch(loadCachedOrders());
                    }

                    if (isActive) {
                        setIsInitialLoad(false);
                        // Start reveal animations after data is loaded
                        startEntranceAnimations();
                        
                        // Hide loading overlay after animations start
                        setTimeout(() => {
                            setShowLoadingOverlay(false);
                        }, 600);
                    }
                } catch (error) {
                    console.log("❌ Error loading orders:", error);
                    if (isActive) {
                        // fallback to cache if fetch fails
                        await dispatch(loadCachedOrders());
                        setIsInitialLoad(false);
                        startEntranceAnimations();
                        setShowLoadingOverlay(false);
                    }
                }
            };

            loadData();

            return () => {
                isActive = false;
            };
        }, [dispatch, pageSizeLocal])
    );

    // Background sync function
    const handleBackgroundSync = async () => {
        if (!isConnected) return;

        try {
            setSyncStatus('syncing');
            console.log('🔄 Starting background sync...');

            await Promise.all([
                dispatch(fetchOrderStats()),
                dispatch(fetchOrders({ page: localCurrentPage, size: pageSizeLocal }))
            ]);

            setSyncStatus('success');
            console.log('✅ Background sync completed');

            setTimeout(() => setSyncStatus('idle'), 3000);
        } catch (error) {
            console.log('❌ Background sync failed:', error);
            setSyncStatus('error');
            setTimeout(() => setSyncStatus('idle'), 3000);
        }
    };

    // Manual refresh function
    const handleRefresh = async () => {
        if (!isConnected) {
            Alert.alert('Offline', 'You are currently offline. Unable to refresh.');
            return;
        }

        setIsRefreshing(true);
        try {
            console.log('🔄 Manual refresh started...');

            // Use page 0 for refresh to get latest data
            await Promise.all([
                dispatch(fetchOrderStats()),
                dispatch(fetchOrders({ page: 0, size: pageSizeLocal }))
            ]);

            console.log('✅ Manual refresh completed');

            // Reset to first page after refresh
            setLocalCurrentPage(0);
            
            // Restart animations after refresh
            startEntranceAnimations();
        } catch (error) {
            console.log('Refresh failed:', error);
            Alert.alert('Sync Failed', 'Unable to refresh data. Please check your connection.');
        } finally {
            setIsRefreshing(false);
        }
    };

    // Page change handler
    const handlePageChange = async (page: number) => {
        if (!isConnected) {
            Alert.alert('Offline', 'Pagination requires internet connection.');
            return;
        }

        setShowLoadingOverlay(true);
        try {
            await dispatch(fetchOrders({ page, size: pageSizeLocal }));
            setLocalCurrentPage(page);
            
            // Start animations and then hide loading overlay
            startEntranceAnimations();
            setTimeout(() => {
                setShowLoadingOverlay(false);
            }, 600);
        } catch (error) {
            console.log('Page change failed:', error);
            Alert.alert('Error', 'Failed to load page. Please try again.');
            setShowLoadingOverlay(false);
        }
    };

    // Sync local page state with Redux state
    useEffect(() => {
        setLocalCurrentPage(currentPage);
    }, [currentPage]);

    // Start reveal animations when we have data
    const startEntranceAnimations = () => {
        console.log('🎬 Starting dashboard reveal animations...');

        // Reset animations first
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.8);
        statsAnim.setValue(0);
        cardAnimations.forEach(anim => anim.setValue(0));

        // Header scale animation (reveal effect)
        Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 50,
            friction: 7,
            useNativeDriver: true,
        }).start();

        // Content fade in
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();

        // Stats animation with slight delay
        Animated.timing(statsAnim, {
            toValue: 1,
            duration: 600,
            delay: 200,
            easing: Easing.out(Easing.back(1.2)),
            useNativeDriver: true,
        }).start();

        // Staggered card animations
        cardAnimations.forEach((anim, index) => {
            if (index < Math.min(orders.length, 4)) {
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 500,
                    delay: 300 + (index * 80),
                    easing: Easing.out(Easing.back(1.1)),
                    useNativeDriver: true,
                }).start();
            }
        });
    };

    // Start animations when we have orders
    useEffect(() => {
        if (!isInitialLoad && (orders.length > 0 || orderStats) && !showLoadingOverlay) {
            console.log('🎬 Starting animations with data:', {
                orders: orders.length,
                hasStats: !!orderStats
            });
            startEntranceAnimations();
        }
    }, [isInitialLoad, orders.length, orderStats, showLoadingOverlay]);

    const getCardTransform = (anim: Animated.Value) => ({
        transform: [
            {
                scale: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 1],
                }),
            },
            {
                translateY: anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                }),
            },
        ],
        opacity: anim,
    });

    const getHeaderTransform = () => ({
        transform: [
            {
                scale: scaleAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                }),
            },
        ],
    });

    const getStatsTransform = () => ({
        transform: [
            {
                scale: statsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                }),
            },
            {
                translateY: statsAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                }),
            },
        ],
        opacity: statsAnim,
    });

    // Format date function
    const formatDate = (start: string, end: string) => {
        try {
            const startDate = new Date(start);
            const endDate = new Date(end);

            if (startDate.toDateString() === endDate.toDateString()) {
                const formattedDate = startDate.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                });
                const startTime = startDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                const endTime = endDate.toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit'
                });
                return `${formattedDate}, ${startTime} – ${endTime}`;
            }

            const formattedStart = startDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            const formattedEnd = endDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });

            return `${formattedStart} – ${formattedEnd}`;
        } catch (error) {
            console.log('Date formatting error:', error);
            return 'Invalid date';
        }
    };

    // Map API status to display status
    const getDisplayStatus = (status: string) => {
        switch (status) {
            case 'SCHEDULED': return 'Scheduled';
            case 'CONFIRMED': return 'Confirmed';
            case 'IN_PROGRESS': return 'In Progress';
            case 'COMPLETED': return 'Completed';
            case 'CANCELLED': return 'Cancelled';
            case 'REQUESTED': return 'Requested';
            default: return status;
        }
    };

    // Map source to display text
    const getDisplaySource = (source: string) => {
        switch (source) {
            case 'MANAGER': return 'Manager';
            case 'TELEPHONE_CUSTOMER': return 'Phone';
            case 'WEB_CUSTOMER': return 'Web';
            default: return source;
        }
    };

    const filteredOrders = orders.filter((order: Order) =>
        selectedFilter === 'All' ||
        (selectedFilter === 'Scheduled' ? order.status === 'SCHEDULED' :
            selectedFilter === 'In Progress' ? order.status === 'IN_PROGRESS' :
                selectedFilter === 'Completed' ? order.status === 'COMPLETED' : false)
    );

    const getStatusColor = (status: string) => {
        return statusColors[status as keyof typeof statusColors] || '#6B7280';
    };

    const getHerdTypeColor = (herdType: string) => {
        return herdTypeColors[herdType as keyof typeof herdTypeColors] || '#6B7280';
    };

    const getSourceColor = (source: string) => {
        return sourceColors[source as keyof typeof sourceColors] || '#6B7280';
    };

    const handleOrderAction = (order: Order, action: string) => {
        let newStatus = order.status;

        switch (action) {
            case 'Start':
                newStatus = 'IN_PROGRESS';
                break;
            case 'Complete':
                newStatus = 'COMPLETED';
                break;
            case 'Cancel':
                newStatus = 'CANCELLED';
                break;
            case 'Reopen':
                newStatus = 'SCHEDULED';
                break;
        }

        Alert.alert(
            `${action} Order`,
            `${action} Order #${order.id}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: action,
                    onPress: () => {
                        dispatch(updateOrderStatus({ orderId: order.id, status: newStatus }))
                            .unwrap()
                            .then(() => {
                                Alert.alert('Success', `Order ${action.toLowerCase()} successfully`);
                                if (showOrderModal) {
                                    closeOrderModal();
                                }
                            })
                            .catch((error) => {
                                Alert.alert('Error', `Failed to ${action.toLowerCase()} order: ${error}`);
                            });
                    }
                }
            ]
        );
    };

    const OrderCard = ({ order, index }: { order: Order; index: number }) => {
        return (
            <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => openOrderModal(order)}
            >
                <Animated.View
                    style={[
                        styles.orderCard,
                        getCardTransform(cardAnimations[index] || new Animated.Value(1)),
                    ]}
                >
                    {/* Order Header */}
                    <View style={styles.orderHeader}>
                        <View style={styles.orderTitleContainer}>
                            <Text style={styles.orderId}>#{order.id}</Text>
                            <View style={styles.orderMeta}>
                                <Text style={styles.yardText}>Yard {order.yardId}</Text>
                                <View style={[styles.sourceBadge, { backgroundColor: getSourceColor(order.source) }]}>
                                    <Text style={styles.sourceText}>{getDisplaySource(order.source)}</Text>
                                </View>
                            </View>
                        </View>
                        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                            <Text style={styles.statusText}>{getDisplayStatus(order.status)}</Text>
                        </View>
                    </View>

                    {/* Contact Info */}
                    <View style={styles.contactContainer}>
                        <Icon name="person" size={14} color="#6B7280" />
                        <Text style={styles.contactText}>{order.contactName}</Text>
                        <Icon name="phone" size={14} color="#6B7280" style={styles.contactIcon} />
                        <Text style={styles.contactText}>{order.contactPhone}</Text>
                    </View>

                    {/* Order Date */}
                    <View style={styles.dateContainer}>
                        <Icon name="schedule" size={14} color="#6B7280" />
                        <Text style={styles.dateText}>{formatDate(order.startTime, order.endTime)}</Text>
                    </View>

                    {/* Order Details */}
                    <View style={styles.detailsContainer}>
                        <View style={styles.detailRow}>
                            <View style={[styles.herdTypeBadge, { backgroundColor: getHerdTypeColor(order.requestedHerdType) }]}>
                                <Text style={styles.herdTypeText}>{order.requestedHerdType}</Text>
                            </View>
                            <View style={styles.headCountContainer}>
                                <Icon name="pets" size={14} color="#6B7280" />
                                <Text style={styles.headCountText}>{order.requestedHeadCount} head</Text>
                            </View>
                        </View>

                        {order.remarks && (
                            <View style={styles.remarksContainer}>
                                <Text style={styles.remarksLabel}>Remarks: </Text>
                                <Text style={styles.remarksText}>{order.remarks}</Text>
                            </View>
                        )}
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        {order.status === 'SCHEDULED' && (
                            <>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.startButton]}
                                    onPress={() => handleOrderAction(order, 'Start')}
                                >
                                    <Icon name="play-arrow" size={16} color="#fff" />
                                    <Text style={styles.actionButtonText}>Start</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.cancelButton]}
                                    onPress={() => handleOrderAction(order, 'Cancel')}
                                >
                                    <Icon name="close" size={16} color="#fff" />
                                    <Text style={styles.actionButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        {order.status === 'IN_PROGRESS' && (
                            <>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.completeButton]}
                                    onPress={() => handleOrderAction(order, 'Complete')}
                                >
                                    <Icon name="check" size={16} color="#fff" />
                                    <Text style={styles.actionButtonText}>Complete</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.actionButton, styles.cancelButton]}
                                    onPress={() => handleOrderAction(order, 'Cancel')}
                                >
                                    <Icon name="close" size={16} color="#fff" />
                                    <Text style={styles.actionButtonText}>Cancel</Text>
                                </TouchableOpacity>
                            </>
                        )}
                        {order.status === 'COMPLETED' && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.reopenButton]}
                                onPress={() => handleOrderAction(order, 'Reopen')}
                            >
                                <Icon name="refresh" size={16} color="#fff" />
                                <Text style={styles.actionButtonText}>Reopen</Text>
                            </TouchableOpacity>
                        )}
                        {order.status === 'CANCELLED' && (
                            <TouchableOpacity
                                style={[styles.actionButton, styles.reopenButton]}
                                onPress={() => handleOrderAction(order, 'Reopen')}
                            >
                                <Icon name="refresh" size={16} color="#fff" />
                                <Text style={styles.actionButtonText}>Reopen</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </Animated.View>
            </TouchableOpacity>
        );
    };

    // Order Detail Modal
    const OrderDetailModal = () => (
        <Modal
            visible={showOrderModal}
            transparent={true}
            animationType="none"
            onRequestClose={closeOrderModal}
        >
            <Animated.View
                style={[
                    styles.modalBackdrop,
                    {
                        opacity: backdropAnim
                    }
                ]}
            >
                <TouchableOpacity
                    style={styles.modalBackdropTouchable}
                    activeOpacity={1}
                    onPress={closeOrderModal}
                />
            </Animated.View>

            <Animated.View
                style={[
                    styles.modalContainer,
                    {
                        transform: [{
                            translateY: modalAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [height, 0]
                            })
                        }]
                    }
                ]}
                {...panResponder.panHandlers}
            >
                {/* Drag Handle */}
                <View style={styles.dragHandle}>
                    <View style={styles.dragHandleBar} />
                </View>

                {selectedOrder && (
                    <View style={styles.modalContent}>
                        {/* Order Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalTitleContainer}>
                                <Text style={styles.modalOrderId}>Order #{selectedOrder.id}</Text>
                                <Text style={styles.modalYardText}>Yard {selectedOrder.yardId}</Text>
                            </View>
                            <View style={[styles.modalStatusBadge, { backgroundColor: getStatusColor(selectedOrder.status) }]}>
                                <Text style={styles.modalStatusText}>{getDisplayStatus(selectedOrder.status)}</Text>
                            </View>
                        </View>

                        {/* Contact Info */}
                        <View style={styles.modalSection}>
                            <View style={styles.modalSectionHeader}>
                                <Icon name="person" size={16} color="#374151" />
                                <Text style={styles.modalSectionTitle}>Contact Information</Text>
                            </View>
                            <View style={styles.modalSectionContent}>
                                <Text style={styles.modalContactName}>{selectedOrder.contactName}</Text>
                                <View style={styles.modalContactPhone}>
                                    <Icon name="phone" size={14} color="#6B7280" />
                                    <Text style={styles.modalContactText}>{selectedOrder.contactPhone}</Text>
                                </View>
                            </View>
                        </View>

                        {/* Schedule */}
                        <View style={styles.modalSection}>
                            <View style={styles.modalSectionHeader}>
                                <Icon name="schedule" size={16} color="#374151" />
                                <Text style={styles.modalSectionTitle}>Schedule</Text>
                            </View>
                            <Text style={styles.modalDateText}>
                                {formatDate(selectedOrder.startTime, selectedOrder.endTime)}
                            </Text>
                        </View>

                        {/* Order Details */}
                        <View style={styles.modalSection}>
                            <View style={styles.modalSectionHeader}>
                                <Icon name="list-alt" size={16} color="#374151" />
                                <Text style={styles.modalSectionTitle}>Order Details</Text>
                            </View>
                            <View style={styles.modalDetailsGrid}>
                                <View style={styles.modalDetailItem}>
                                    <Text style={styles.modalDetailLabel}>Herd Type</Text>
                                    <View style={[styles.modalHerdTypeBadge, { backgroundColor: getHerdTypeColor(selectedOrder.requestedHerdType) }]}>
                                        <Text style={styles.modalHerdTypeText}>{selectedOrder.requestedHerdType}</Text>
                                    </View>
                                </View>
                                <View style={styles.modalDetailItem}>
                                    <Text style={styles.modalDetailLabel}>Head Count</Text>
                                    <Text style={styles.modalDetailValue}>{selectedOrder.requestedHeadCount} head</Text>
                                </View>
                                <View style={styles.modalDetailItem}>
                                    <Text style={styles.modalDetailLabel}>Source</Text>
                                    <View style={[styles.modalSourceBadge, { backgroundColor: getSourceColor(selectedOrder.source) }]}>
                                        <Text style={styles.modalSourceText}>{getDisplaySource(selectedOrder.source)}</Text>
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Remarks */}
                        {selectedOrder.remarks && (
                            <View style={styles.modalSection}>
                                <View style={styles.modalSectionHeader}>
                                    <Icon name="notes" size={16} color="#374151" />
                                    <Text style={styles.modalSectionTitle}>Remarks</Text>
                                </View>
                                <Text style={styles.modalRemarksText}>{selectedOrder.remarks}</Text>
                            </View>
                        )}

                        {/* Action Buttons */}
                        <View style={styles.modalActions}>
                            {selectedOrder.status === 'SCHEDULED' && (
                                <>
                                    <TouchableOpacity
                                        style={[styles.modalActionButton, styles.modalStartButton]}
                                        onPress={() => handleOrderAction(selectedOrder, 'Start')}
                                    >
                                        <Icon name="play-arrow" size={20} color="#fff" />
                                        <Text style={styles.modalActionButtonText}>Start Order</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalActionButton, styles.modalCancelButton]}
                                        onPress={() => handleOrderAction(selectedOrder, 'Cancel')}
                                    >
                                        <Icon name="close" size={20} color="#fff" />
                                        <Text style={styles.modalActionButtonText}>Cancel Order</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            {selectedOrder.status === 'IN_PROGRESS' && (
                                <>
                                    <TouchableOpacity
                                        style={[styles.modalActionButton, styles.modalCompleteButton]}
                                        onPress={() => handleOrderAction(selectedOrder, 'Complete')}
                                    >
                                        <Icon name="check" size={20} color="#fff" />
                                        <Text style={styles.modalActionButtonText}>Complete Order</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.modalActionButton, styles.modalCancelButton]}
                                        onPress={() => handleOrderAction(selectedOrder, 'Cancel')}
                                    >
                                        <Icon name="close" size={20} color="#fff" />
                                        <Text style={styles.modalActionButtonText}>Cancel Order</Text>
                                    </TouchableOpacity>
                                </>
                            )}
                            {selectedOrder.status === 'COMPLETED' && (
                                <TouchableOpacity
                                    style={[styles.modalActionButton, styles.modalReopenButton]}
                                    onPress={() => handleOrderAction(selectedOrder, 'Reopen')}
                                >
                                    <Icon name="refresh" size={20} color="#fff" />
                                    <Text style={styles.modalActionButtonText}>Reopen Order</Text>
                                </TouchableOpacity>
                            )}
                            {selectedOrder.status === 'CANCELLED' && (
                                <TouchableOpacity
                                    style={[styles.modalActionButton, styles.modalReopenButton]}
                                    onPress={() => handleOrderAction(selectedOrder, 'Reopen')}
                                >
                                    <Icon name="refresh" size={20} color="#fff" />
                                    <Text style={styles.modalActionButtonText}>Reopen Order</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>
                )}
            </Animated.View>
        </Modal>
    );

    const FilterTabs = () => (
        <Animated.View style={[styles.filterContainer, { opacity: fadeAnim }]}>
            {filterOptions.map((filter) => (
                <TouchableOpacity
                    key={filter}
                    style={[
                        styles.filterTab,
                        selectedFilter === filter && styles.filterTabActive
                    ]}
                    onPress={() => setSelectedFilter(filter)}
                >
                    <Text style={[
                        styles.filterText,
                        selectedFilter === filter && styles.filterTextActive
                    ]}>
                        {filter}
                    </Text>
                    {selectedFilter === filter && (
                        <View style={styles.filterIndicator} />
                    )}
                </TouchableOpacity>
            ))}
        </Animated.View>
    );

    const StatsOverview = () => (
        <Animated.View style={[styles.statsContainer, getStatsTransform()]}>
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{orderStats?.total || 0}</Text>
                <Text style={styles.statLabel}>Total Orders</Text>
            </View>
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{orderStats?.scheduled || 0}</Text>
                <Text style={styles.statLabel}>Scheduled</Text>
            </View>
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{orderStats?.inProgress || 0}</Text>
                <Text style={styles.statLabel}>In Progress</Text>
            </View>
            <View style={styles.statItem}>
                <Text style={styles.statNumber}>{orderStats?.completed || 0}</Text>
                <Text style={styles.statLabel}>Completed</Text>
            </View>
        </Animated.View>
    );

    const Pagination = () => (
        <Animated.View style={[styles.pagination, { opacity: fadeAnim }]}>
            <TouchableOpacity
                style={[styles.pageButton, localCurrentPage === 0 && styles.pageButtonDisabled]}
                onPress={() => localCurrentPage > 0 && handlePageChange(localCurrentPage - 1)}
                disabled={localCurrentPage === 0 || !isConnected}
            >
                <Icon name="chevron-left" size={20} color={localCurrentPage === 0 || !isConnected ? '#9CA3AF' : Color.primary} />
            </TouchableOpacity>

            <View style={styles.pageInfo}>
                <Text style={styles.pageText}>
                    Page {localCurrentPage + 1} of {totalPages || 1}
                </Text>
                <Text style={styles.pageSizeText}>
                    Showing {Math.min(orders.length, pageSizeLocal)} of {totalElements} orders
                </Text>
                {!isConnected && (
                    <Text style={styles.offlineText}>Offline Mode</Text>
                )}
            </View>

            <TouchableOpacity
                style={[styles.pageButton, (localCurrentPage === (totalPages - 1) || !isConnected) && styles.pageButtonDisabled]}
                onPress={() => localCurrentPage < (totalPages - 1) && handlePageChange(localCurrentPage + 1)}
                disabled={localCurrentPage === (totalPages - 1) || !isConnected}
            >
                <Icon name="chevron-right" size={20} color={localCurrentPage === (totalPages - 1) || !isConnected ? '#9CA3AF' : Color.primary} />
            </TouchableOpacity>
        </Animated.View>
    );

    const NetworkStatus = () => (
        <View style={[
            styles.networkStatus,
            isConnected === false && styles.networkStatusOffline,
            syncStatus === 'syncing' && styles.networkStatusSyncing
        ]}>
            <Icon
                name={
                    syncStatus === 'syncing' ? 'sync' :
                        isConnected ? 'wifi' : 'wifi-off'
                }
                size={14}
                color={
                    syncStatus === 'syncing' ? '#3B82F6' :
                        isConnected ? '#10B981' : '#6B7280'
                }
            />
            <Text style={[
                styles.networkText,
                {
                    color: syncStatus === 'syncing' ? '#3B82F6' :
                        isConnected ? '#10B981' : '#6B7280'
                }
            ]}>
                {syncStatus === 'syncing' ? 'Syncing...' :
                    isConnected ? 'Online' : 'Offline'}
            </Text>
            {syncStatus === 'success' && (
                <Icon name="check-circle" size={14} color="#10B981" style={styles.syncIcon} />
            )}
            {syncStatus === 'error' && (
                <Icon name="error" size={14} color="#EF4444" style={styles.syncIcon} />
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            {/* Loading Overlay with Order Theme */}
            {showLoadingOverlay && (
                <LoadingOverlay isConnected={isConnected} />
            )}

            {/* Header with reveal effect */}
            <Animated.View style={[styles.header, getHeaderTransform()]}>
                <TouchableOpacity
                    onPress={() => {
                        if (navigation.canGoBack()) {
                            navigation.goBack();   // works if opened via Stack
                        } else {
                            navigation.navigate('Dashboard' as never);  // fallback to drawer home
                        }
                    }}
                    style={styles.headerButton}
                >
                    <Icon name="menu" color={'#fff'} size={24} />
                </TouchableOpacity>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Orders</Text>
                    <View style={styles.headerUnderline} />
                </View>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
                    <Icon name="arrow-back" color={'#fff'} size={24} />
                </TouchableOpacity>
            </Animated.View>

            {/* Network Status */}
            {/* <NetworkStatus /> */}

            {/* Stats Overview with reveal effect */}
            <StatsOverview />

            {/* Filter Tabs */}
            <FilterTabs />

            {/* Orders List */}
            <Animated.View style={[styles.listContainer, { opacity: fadeAnim }]}>
                <FlatList
                    data={filteredOrders}
                    renderItem={({ item, index }) => <OrderCard order={item} index={index} />}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Icon name="receipt" size={48} color="#D1D5DB" />
                            <Text style={styles.emptyText}>
                                {isInitialLoad ? 'Loading orders...' : 'No orders found'}
                            </Text>
                            <Text style={styles.emptySubtext}>
                                {!isConnected ? 'You are currently offline' : 'No orders match the current filter'}
                            </Text>
                        </View>
                    }
                    refreshControl={
                        <RefreshControl
                            refreshing={isRefreshing}
                            onRefresh={handleRefresh}
                            colors={[Color.primary]}
                            tintColor={Color.primary}
                            enabled={isConnected === true}
                        />
                    }
                />
            </Animated.View>

            {/* Pagination */}
            <Pagination />

            {/* Order Detail Modal */}
            <OrderDetailModal />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    // Loading Overlay Styles
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(249, 250, 251, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
    },
    loadingContent: {
        alignItems: 'center',
        padding: 20,
    },
    orderIconContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    iconPulse: {
        position: 'absolute',
        top: -10,
        left: -10,
        right: -10,
        bottom: -10,
        backgroundColor: '#10B98120',
        borderRadius: 34,
        borderWidth: 2,
        borderColor: '#10B98140',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 18,
        color: Color.primary,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    loadingSubtext: {
        marginTop: 8,
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 20,
    },
    loadingSpinner: {
        marginTop: 10,
    },
    header: {
        backgroundColor: Color.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 4,
    },
    headerButton: {
        padding: 8,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    headerTitleContainer: {
        alignItems: 'center',
        flex: 1,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5,
    },
    headerUnderline: {
        width: 40,
        height: 2,
        backgroundColor: '#86EFAC',
        borderRadius: 1,
        marginTop: 4,
    },
    networkStatus: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: '#F0F9FF',
        marginHorizontal: 16,
        marginTop: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0F2FE',
    },
    networkStatusOffline: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA',
    },
    networkStatusSyncing: {
        backgroundColor: '#EFF6FF',
        borderColor: '#DBEAFE',
    },
    networkText: {
        fontSize: 12,
        fontWeight: '500',
        marginLeft: 6,
    },
    syncIcon: {
        marginLeft: 4,
    },
    statsContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginVertical: 16,
        marginHorizontal: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        paddingVertical: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Color.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
    },
    filterContainer: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        marginBottom: 16,
        backgroundColor: '#fff',
        borderRadius: 12,
        marginHorizontal: 16,
        paddingVertical: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    filterTab: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 8,
        margin: 4,
        position: 'relative',
    },
    filterTabActive: {
        backgroundColor: '#F0F9FF',
    },
    filterText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    filterTextActive: {
        color: Color.primary,
        fontWeight: '600',
    },
    filterIndicator: {
        position: 'absolute',
        bottom: 4,
        width: 20,
        height: 3,
        backgroundColor: Color.primary,
        borderRadius: 2,
    },
    listContainer: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 80,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 2,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    orderTitleContainer: {
        flex: 1,
    },
    orderId: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    orderMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    yardText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    sourceBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    sourceText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    contactContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    contactText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
    },
    contactIcon: {
        marginLeft: 12,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    dateText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 6,
        flex: 1,
    },
    detailsContainer: {
        marginBottom: 12,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    herdTypeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    herdTypeText: {
        color: '#fff',
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    headCountContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    headCountText: {
        fontSize: 12,
        color: '#6B7280',
        marginLeft: 4,
    },
    remarksContainer: {
        flexDirection: 'row',
    },
    remarksLabel: {
        fontSize: 12,
        color: '#6B7280',
        fontWeight: '600',
    },
    remarksText: {
        fontSize: 12,
        color: '#6B7280',
        flex: 1,
    },
    actionButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
        flexWrap: 'wrap',
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        gap: 4,
    },
    startButton: {
        backgroundColor: '#10B981',
    },
    completeButton: {
        backgroundColor: '#10B981',
    },
    reopenButton: {
        backgroundColor: '#6B7280',
    },
    cancelButton: {
        backgroundColor: '#EF4444',
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    emptyText: {
        fontSize: 18,
        color: '#6B7280',
        marginTop: 16,
        marginBottom: 8,
        fontWeight: '600',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        textAlign: 'center',
        lineHeight: 20,
    },
    pagination: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    pageInfo: {
        alignItems: 'center',
    },
    pageButton: {
        padding: 8,
        borderRadius: 6,
    },
    pageButtonDisabled: {
        opacity: 0.5,
    },
    pageText: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '600',
    },
    pageSizeText: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 2,
    },
    offlineText: {
        fontSize: 10,
        color: '#EF4444',
        marginTop: 2,
        fontWeight: '500',
    },
    // Modal Styles
    modalBackdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalBackdropTouchable: {
        flex: 1,
    },
    modalContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: height * 0.85,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
    },
    dragHandle: {
        alignItems: 'center',
        paddingVertical: 8,
    },
    dragHandleBar: {
        width: 40,
        height: 4,
        backgroundColor: '#E5E7EB',
        borderRadius: 2,
    },
    modalContent: {
        padding: 20,
        paddingBottom: 30,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    modalTitleContainer: {
        flex: 1,
    },
    modalOrderId: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 4,
    },
    modalYardText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    modalStatusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    modalStatusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    modalSection: {
        marginBottom: 20,
    },
    modalSectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 8,
    },
    modalSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
    },
    modalSectionContent: {
        marginLeft: 24,
    },
    modalContactName: {
        fontSize: 16,
        fontWeight: '500',
        color: '#111827',
        marginBottom: 4,
    },
    modalContactPhone: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    modalContactText: {
        fontSize: 14,
        color: '#6B7280',
    },
    modalDateText: {
        fontSize: 14,
        color: '#6B7280',
        marginLeft: 24,
        lineHeight: 20,
    },
    modalDetailsGrid: {
        marginLeft: 24,
        gap: 12,
    },
    modalDetailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    modalDetailLabel: {
        fontSize: 14,
        color: '#6B7280',
        fontWeight: '500',
    },
    modalDetailValue: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },
    modalHerdTypeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    modalHerdTypeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    modalSourceBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    modalSourceText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    modalRemarksText: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginLeft: 24,
    },
    modalActions: {
        marginTop: 20,
        gap: 12,
    },
    modalActionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 8,
        gap: 8,
    },
    modalStartButton: {
        backgroundColor: '#10B981',
    },
    modalCompleteButton: {
        backgroundColor: '#10B981',
    },
    modalReopenButton: {
        backgroundColor: '#6B7280',
    },
    modalCancelButton: {
        backgroundColor: '#EF4444',
    },
    modalActionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default OrderScreen;