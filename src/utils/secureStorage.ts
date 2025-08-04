/**
 * Secure storage utility to replace direct localStorage usage
 * Adds encryption and improved security for sensitive data
 */

import CryptoJS from "crypto-js";
import Logger from "./logger";

// Use environmental variable if available or default secret key
// In a production app, this should come from environment variables
const SECRET_KEY =
  process.env.REACT_APP_STORAGE_SECRET_KEY ||
  "dashboard-web-secure-storage-key";

export class SecureStorage {
  /**
   * Store a value securely with encryption
   * @param key - Storage key
   * @param value - Value to store (can be any JSON serializable value)
   */
  static setItem(key: string, value: any): void {
    try {
      // Convert value to string if it's not already
      const valueStr =
        typeof value === "string" ? value : JSON.stringify(value);

      // Encrypt the value
      const encryptedValue = CryptoJS.AES.encrypt(
        valueStr,
        SECRET_KEY
      ).toString();

      // Store with a prefix to identify encrypted values
      localStorage.setItem(`sec_${key}`, encryptedValue);
    } catch (error) {
      Logger.error(`Failed to securely store item at key: ${key}`, error);
      // Fallback to regular storage in case of encryption errors
      localStorage.setItem(key, JSON.stringify(value));
    }
  }

  /**
   * Retrieve and decrypt a stored value
   * @param key - Storage key
   * @param defaultValue - Default value if key doesn't exist
   * @returns The decrypted value or defaultValue if not found
   */
  static getItem<T>(key: string, defaultValue: T | null = null): T | null {
    try {
      // Try to get the encrypted value
      const encryptedValue = localStorage.getItem(`sec_${key}`);

      // If no value found, return default
      if (!encryptedValue) {
        return defaultValue;
      }

      // Decrypt the value
      const decryptedBytes = CryptoJS.AES.decrypt(encryptedValue, SECRET_KEY);
      const decryptedValue = decryptedBytes.toString(CryptoJS.enc.Utf8);

      // Parse if it's JSON or return as is
      try {
        return JSON.parse(decryptedValue);
      } catch {
        return decryptedValue as unknown as T;
      }
    } catch (error) {
      Logger.error(`Failed to retrieve secure item at key: ${key}`, error);

      // Try fallback to regular storage
      try {
        const fallbackValue = localStorage.getItem(key);
        return fallbackValue ? JSON.parse(fallbackValue) : defaultValue;
      } catch {
        return defaultValue;
      }
    }
  }
  /**
   * Remove an item from secure storage
   * @param key - Storage key to remove
   */
  static removeItem(key: string): void {
    try {
      localStorage.removeItem(`sec_${key}`);
      // Also remove potential non-secure version
      localStorage.removeItem(key);
    } catch (error) {
      Logger.error(`Failed to remove item at key: ${key}`, error);
    }
  }

  /**
   * Clear all secure storage items
   * (only clears items with the secure prefix)
   */
  static clear(): void {
    try {
      // Only remove items with our secure prefix
      Object.keys(localStorage)
        .filter((key) => key.startsWith("sec_"))
        .forEach((key) => localStorage.removeItem(key));
    } catch (error) {
      Logger.error("Failed to clear secure storage", error);
    }
  }
}

export default SecureStorage;
