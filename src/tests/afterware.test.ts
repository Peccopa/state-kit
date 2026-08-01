import { describe, it, expect, beforeEach } from 'vitest';
import StateKit from '../';
import type { Action } from '../types/types';

type State = { count: number };

function incrementReducer(state: State, action: Action): State {
  if (action.type === 'INCREMENT') return { ...state, count: state.count + 1 };
  return state;
}

type Afterware<State, Action> = (parameters: {
  prevState: Readonly<State>;
  nextState: Readonly<State>;
  action: Action;
}) => void | Promise<void>;

let log: string[] = [];

const afterwareLog: Afterware<State, Action> = async ({
  nextState,
  action,
}) => {
  log.push(`after-${action.type}-${nextState.count}`);
};

const afterwareNoop: Afterware<State, Action> = async () => {};

describe('StateKit - afterware', () => {
  beforeEach(() => {
    log = [];
  });

  it('should call afterware after reducers have run', async () => {
    const stateKit = new StateKit<State, Action>({ count: 1 });
    stateKit.addReducer(incrementReducer);
    stateKit.addAfterware(afterwareLog);

    await stateKit.dispatch({ type: 'INCREMENT' });
    expect(log).toEqual(['after-INCREMENT-2']);
  });

  it('should call multiple afterware in order', async () => {
    const calls: string[] = [];
    const aw1: Afterware<State, Action> = async ({ nextState }) => {
      calls.push(`aw1-${nextState.count}`);
    };
    const aw2: Afterware<State, Action> = async ({ nextState }) => {
      calls.push(`aw2-${nextState.count}`);
    };

    const stateKit = new StateKit<State, Action>({ count: 1 });
    stateKit.addReducer(incrementReducer);
    stateKit.addAfterware(aw1, aw2);

    await stateKit.dispatch({ type: 'INCREMENT' });
    expect(calls).toEqual(['aw1-2', 'aw2-2']);
  });

  it('should still work if afterware does nothing', async () => {
    const stateKit = new StateKit<State, Action>({ count: 0 });
    stateKit.addReducer(incrementReducer);
    stateKit.addAfterware(afterwareNoop);
    await stateKit.dispatch({ type: 'INCREMENT' });
    expect(stateKit.getState().count).toBe(1);
  });
});
