/* eslint-env jest */

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = {};
  return {
    __esModule: true,
    default: {
      getItem: jest.fn(key => Promise.resolve(store[key] ?? null)),
      setItem: jest.fn((key, value) => {
        store[key] = value;
        return Promise.resolve();
      }),
      removeItem: jest.fn(key => {
        delete store[key];
        return Promise.resolve();
      }),
      clear: jest.fn(() => Promise.resolve()),
    },
  };
});

jest.mock('react-native-background-timer', () => ({
  setInterval: jest.fn(() => 1),
  clearInterval: jest.fn(),
  setTimeout: jest.fn(() => 1),
  clearTimeout: jest.fn(),
}));

jest.mock('react-native-sound', () =>
  jest.fn().mockImplementation(() => ({
    setNumberOfLoops: jest.fn(),
    play: jest.fn(),
    stop: jest.fn(callback => callback && callback()),
  })),
);

jest.mock('react-native-sensors', () => ({
  SensorTypes: {accelerometer: 'accelerometer'},
  accelerometer: {subscribe: jest.fn(() => ({unsubscribe: jest.fn()}))},
  setUpdateIntervalForType: jest.fn(),
}));

jest.mock('@react-native-community/datetimepicker', () => {
  const picker = jest.fn(() => null);
  picker.DateTimePickerAndroid = {open: jest.fn()};
  picker.DateTimePickerEvent = {};
  return picker;
});
