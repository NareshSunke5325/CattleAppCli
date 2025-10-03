import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
  ScrollView,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useAppDispatch, useAppSelector } from '../store/store';
import { fetchDashboard } from '../store/slices/dashboardSlice';
import { logout } from '../store/slices/authSlice';
import { Color } from '../theme';

const DEVICE_HEIGHT = Dimensions.get('window').height;
const DEVICE_WIDTH = Dimensions.get('window').width;

const Dashboard = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { data, loading, error } = useAppSelector((state) => state.dashboard);

  // Animation values for content reveal
  const [cardAnimations] = useState(
    Array(6).fill(0).map(() => new Animated.Value(0))
  );
  const [headerScale] = useState(new Animated.Value(0));
  const [contentOpacity] = useState(new Animated.Value(0));

  useEffect(() => {
    dispatch(fetchDashboard());
  }, []);

  // Start animations when loading is complete
  useEffect(() => {
    if (!loading) {
      startEntranceAnimations();
    }
  }, [loading]);

  const startEntranceAnimations = () => {
    // Header scale animation
    Animated.spring(headerScale, {
      toValue: 1,
      tension: 50,
      friction: 7,
      useNativeDriver: true,
    }).start();

    // Content fade in
    Animated.timing(contentOpacity, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Staggered card animations (collapse/expand effect)
    cardAnimations.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 800,
        delay: 200 + (index * 120), // Staggered delay
        easing: Easing.out(Easing.back(1.2)), // Bounce effect
        useNativeDriver: true,
      }).start();
    });
  };

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
        scale: headerScale.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1],
        }),
      },
    ],
  });

  function logoutCalled() {
    Alert.alert('', 'Are you sure you want to logout from Cattle Yard Management?', [
      {
        text: 'Yes',
        onPress: () => {
          dispatch(logout());
          navigation.navigate('LoginScreen');
        },
      },
      { text: 'No', onPress: () => null },
    ]);
  }

  const dashboardCards = [
    {
      id: 1,
      title: 'Yards',
      subtitle: 'Manage yard facilities & infrastructure',
      icon: '🏛️',
      backgroundImage: require('../images/Yard-Image-800X533.png'),
      route: 'YardsScreen',
      stats: '6 Active Yards'
    },
    {
      id: 2,
      title: 'Livestock',
      subtitle: 'Manage cattle herd & inventory',
      icon: '🐄',
      backgroundImage: require('../images/Users-Image-800X533.png'),
      route: 'LivestockScreen',
      stats: '245 Head'
    },
    {
      id: 3,
      title: 'Rosters',
      subtitle: 'Staff scheduling & work assignments',
      icon: '📋',
      backgroundImage: require('../images/Roasters-Image-800X533.png'),
      route: 'TaskRosterScreen',
      stats: '12 Staff Active'
    },
    {
      id: 4,
      title: 'Orders',
      subtitle: 'Cattle sales & purchase orders',
      icon: '📦',
      backgroundImage: require('../images/Live-Stock-Image-800X533.png'),
      route: '',
      stats: '5 Pending Orders'
    },
    {
      id: 5,
      title: 'Notifications',
      subtitle: 'Alerts & important updates',
      icon: '🔔',
      backgroundImage: require('../images/Notifications-Images-800X533.png'),
      route: '',
      stats: '3 New Alerts'
    },
    {
      id: 6,
      title: 'Users',
      subtitle: 'User management & permissions',
      icon: '👥',
      backgroundImage: require('../images/Orders-Image-800X533.png'),
      route: '',
      stats: '10 Active Users'
    },
  ];

  const handleCardPress = (card: any, index: number) => {
    // Press animation
    Animated.sequence([
      Animated.timing(cardAnimations[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(cardAnimations[index], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (card.route) {
        navigation.navigate(card.route);
      }
    });
  };

  const renderCard = (card: any, index: number) => {
    return (
      <Animated.View
        key={card.id}
        style={[
          styles.card,
          getCardTransform(cardAnimations[index]),
        ]}
      >
        <TouchableOpacity
          onPress={() => handleCardPress(card, index)}
          activeOpacity={0.9}
          style={{ flex: 1 }}
        >
          {/* Background Image */}
          <ImageBackground
            source={card.backgroundImage}
            style={styles.cardBackgroundImage}
            imageStyle={styles.cardImageStyle}
          >
            {/* Dark Overlay */}
            {/* <View style={styles.darkOverlay} /> */}

            {/* Glass Effect Overlay */}
            {/* <View style={styles.glassOverlay} /> */}

            {/* Card Content */}
            <View style={styles.cardContent}>
              {/* Icon Container */}
              <View style={styles.iconContainer}>
                <Text style={styles.cardIcon}>{card.icon}</Text>
              </View>

              {/* Card Info */}
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>

                {/* Stats Badge */}
                <View style={styles.statsBadge}>
                  <Text style={styles.statsText}>{card.stats}</Text>
                </View>
              </View>

              {/* Arrow Icon */}
              {/* <View style={styles.arrowContainer}>
                <Icon name="arrow-forward" size={28} color="rgba(255, 255, 255, 0.9)" />
              </View> */}
            </View>

            {/* Decorative Elements */}
            <View style={styles.decorativeCircle1} />
            <View style={styles.decorativeCircle2} />

            {/* Shimmer Effect */}
            {/* <View style={styles.shimmerEffect} /> */}
          </ImageBackground>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <ImageBackground
      style={{
        backgroundColor: Color.primary,
        justifyContent: 'flex-start',
        height: DEVICE_HEIGHT,
      }}
    >
      <View
        style={{
          ...StyleSheet.absoluteFillObject,
          backgroundColor: 'rgba(245, 250, 247, 0.95)',
        }}
      />

    
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ backgroundColor: 'rgba(245, 245, 245, 0.1)', flex: 1 }}>

          {/* Header with Animation */}
          <Animated.View style={[styles.header, getHeaderTransform()]}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => {
                navigation.dispatch(DrawerActions.openDrawer());
              }}
            >
              <Icon name="menu" color={'#fff'} size={24} />
            </TouchableOpacity>

            <View style={{ alignItems: 'center', flex: 1 }}>
              <Text style={styles.headerTitle}>Dashboard</Text>
              <View style={styles.headerUnderline} />
            </View>

            <TouchableOpacity onPress={logoutCalled} style={styles.headerButton}>
              <Icon name="logout" color={'#fff'} size={24} />
            </TouchableOpacity>
          </Animated.View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Color.primary} />
              <Text style={styles.loadingText}>Loading dashboard...</Text>
            </View>
          ) : (
            <Animated.View style={[styles.contentContainer, { opacity: contentOpacity }]}>
              <ScrollView
                style={{ flex: 1 }}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContainer}
              >
                {/* Cards Grid with Staggered Animations */}
                <View style={styles.cardsContainer}>
                  {dashboardCards.map((card, index) =>
                    renderCard(card, index)
                  )}
                </View>

                {/* Bottom Spacing */}
                <View style={{ height: 20 }} />
              </ScrollView>
            </Animated.View>
          )}
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: Color.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 65,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 10,
  },
  headerButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerTitle: {
    fontSize: 22,
    color: '#fff',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerUnderline: {
    width: 50,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderRadius: 1,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    color: Color.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  contentContainer: {
    flex: 1,
  },
  scrollContainer: {
    padding: 16,
  },
  cardsContainer: {
    flex: 1,
  },
  card: {
    height: 200,
    width: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 20,
    position: 'relative',
    marginBottom: 20,
  },
  cardBackgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  cardImageStyle: {
    borderRadius: 24,
  },
  darkOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 24,
  },
  glassOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  cardContent: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardIcon: {
    fontSize: 30,
  },
  cardInfo: {
    flex: 1,
    paddingRight: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 10,
    lineHeight: 18,
  },
  statsBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  statsText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  arrowContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  decorativeCircle1: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  shimmerEffect: {
    position: 'absolute',
    top: 0,
    left: -100,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ skewX: '-20deg' }],
  },
});

export default Dashboard;