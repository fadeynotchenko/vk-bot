import { expect, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Расширяем expect с matchers из jest-dom
expect.extend(matchers);

// Очистка после каждого теста
afterEach(() => {
  cleanup();
});

