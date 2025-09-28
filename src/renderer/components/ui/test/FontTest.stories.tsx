import type { Meta, StoryObj } from '@storybook/react';
import { FontTest } from './FontTest';

const meta = {
  title: 'Test/FontTest',
  component: FontTest,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Component to test and verify that Caveat and Noto Sans fonts are loading correctly from Google Fonts.'
      }
    }
  },
  tags: ['autodocs'],
  argTypes: {
    text: {
      control: 'text',
      description: 'Text content to display for font testing'
    }
  },
} satisfies Meta<typeof FontTest>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default font test showing both Noto Sans (body) and Caveat (display) fonts
 */
export const Default: Story = {
  args: {
    text: 'The quick brown fox jumps over the lazy dog'
  },
};

/**
 * Japanese text test to verify Noto Sans support for international characters
 */
export const JapaneseText: Story = {
  args: {
    text: 'こんにちは、世界！Gridparkへようこそ'
  },
};

/**
 * Numbers and symbols test
 */
export const NumbersAndSymbols: Story = {
  args: {
    text: '1234567890 !@#$%^&*()_+-=[]{}|;:,.<>?'
  },
};

/**
 * Mixed case test
 */
export const MixedCase: Story = {
  args: {
    text: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
  },
};