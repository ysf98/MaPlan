export type ActionState = {
  error: string | null;
  success: boolean;
};

export const INITIAL_ACTION_STATE: ActionState = {
  error: null,
  success: false
};

export function actionFailure(error: string): ActionState {
  return {
    error,
    success: false
  };
}

export function actionSuccess(): ActionState {
  return {
    error: null,
    success: true
  };
}
