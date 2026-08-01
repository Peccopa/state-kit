import { describe, it, expect, vi } from 'vitest';
import StateKit from '../';
import type { Action } from '../types/types';

type State = { count: number };

function incrementReducer(state: State, action: Action): State {
  if (action.type === 'INCREMENT') return { ...state, count: state.count + 1 };
  return state;
}

function doubleReducer(state: State, action: Action): State {
  if (action.type === 'INCREMENT') return { ...state, count: state.count * 2 };
  return state;
}

describe('StateKit - reducers', () => {
  it('should update state via reducer on dispatch', async () => {
    const stateKit = new StateKit<State, Action>({ count: 0 });
    stateKit.addReducer(incrementReducer);
    await stateKit.dispatch({ type: 'INCREMENT' });
    expect(stateKit.getState().count).toBe(1);
  });

  it('should ignore unknown actions', async () => {
    const stateKit = new StateKit<State, Action>({ count: 0 });
    stateKit.addReducer(incrementReducer);
    await stateKit.dispatch({ type: 'UNKNOWN' });
    expect(stateKit.getState().count).toBe(0);
  });

  it('should apply multiple reducers sequentially', async () => {
    const stateKit = new StateKit<State, Action>({ count: 1 });
    stateKit.addReducer(incrementReducer);
    stateKit.addReducer(doubleReducer);
    await stateKit.dispatch({ type: 'INCREMENT' });
    expect(stateKit.getState().count).toBe(4);
  });

  it('should respect reducer order', async () => {
    const stateKit = new StateKit<State, Action>({ count: 1 });
    stateKit.addReducer(doubleReducer);
    stateKit.addReducer(incrementReducer);
    await stateKit.dispatch({ type: 'INCREMENT' });
    expect(stateKit.getState().count).toBe(3);
  });

  it('should continue dispatching after reducer throws', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const failingReducer = (_state: State, _action: Action): State => {
      throw new Error('Reducer failed');
    };

    try {
      const stateKit = new StateKit<State, Action>({ count: 0 });

      stateKit.addReducer(failingReducer);
      await stateKit.dispatch({ type: 'INCREMENT' });

      stateKit.removeReducer(failingReducer);
      stateKit.addReducer(incrementReducer);
      await stateKit.dispatch({ type: 'INCREMENT' });

      expect(stateKit.getState().count).toBe(1);
      expect(consoleError).toHaveBeenCalledOnce();
    } finally {
      consoleError.mockRestore();
    }
  });
});
