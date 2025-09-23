import AsyncStorage from '@react-native-async-storage/async-storage';

export default class StorageService {
  static async storeData(key: string, value: any): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      console.log(`[StorageService] Data stored under key: "${key}"`);
    } catch (e) {
      console.error(`[StorageService] Failed to store data:`, e);
    }
  }

  static async getData<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? (JSON.parse(jsonValue) as T) : null;
    } catch (e) {
      console.error(`[StorageService] Failed to get data:`, e);
      return null;
    }
  }

  static async removeData(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`[StorageService] Data removed for key: "${key}"`);
    } catch (e) {
      console.error(`[StorageService] Failed to remove data:`, e);
    }
  }

  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
      console.log('[StorageService] All data cleared');
    } catch (e) {
      console.error('[StorageService] Failed to clear all data:', e);
    }
  }
}

