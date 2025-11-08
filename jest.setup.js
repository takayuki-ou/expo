// Timersのグローバル設定
const timers = require('timers');

const realSetTimeout = timers.setTimeout;
const realClearTimeout = timers.clearTimeout;
const realSetInterval = timers.setInterval;
const realClearInterval = timers.clearInterval;

global.setTimeout = Object.assign(
  (fn, delay) => {
    const id = realSetTimeout(fn, delay || 0);
    return {
      ...id,
      unref: () => id,
      ref: () => id,
      [Symbol.toPrimitive]: () => id,
    };
  },
  { unref: jest.fn(), ref: jest.fn() }
);

global.clearTimeout = realClearTimeout;
global.setInterval = realSetInterval;
global.clearInterval = realClearInterval;

// React Nativeのグローバルモック
global.window = {};

// NativeModulesのモック
jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

// Alertのモック - 最初に設定
jest.mock('react-native', () => {
  const actualRN = jest.requireActual('react-native');
  return {
    ...actualRN,
    Alert: {
      alert: jest.fn(),
    },
  };
});

// React Nativeモジュールのモック
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

jest.mock('expo', () => ({
  registerRootComponent: jest.fn(),
}));

jest.mock('expo-modules-core', () => ({
  NativeModulesProxy: {},
  requireNativeViewManager: jest.fn(),
  requireNativeModule: jest.fn(),
  requireOptionalNativeModule: jest.fn(() => null),
}));

jest.mock('@expo/vector-icons', () => ({
  FontAwesome: 'FontAwesome',
}));

// HeatmapViewのモック
jest.mock('@/components/HeatmapView', () => ({
  HeatmapView: 'HeatmapView',
}));

// TurboModuleRegistryのモック
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => {
  return {
    getEnforcing: jest.fn((name) => {
      if (name === 'DeviceInfo') {
        return {
          getConstants: () => ({
            Dimensions: {
              window: { width: 375, height: 667, scale: 2, fontScale: 1 },
              screen: { width: 375, height: 667, scale: 2, fontScale: 1 },
            },
          }),
        };
      }
      if (name === 'PlatformConstants') {
        return {
          getConstants: () => ({
            isTesting: false,
            reactNativeVersion: { major: 0, minor: 79, patch: 5 },
          }),
        };
      }
      return { getConstants: () => ({}) };
    }),
    get: jest.fn(() => null),
  };
});

console.error = jest.fn();
console.warn = jest.fn();
