export function setMutationFlag(state, itemKey, mutationKey, value) {
  return {
    ...state,
    [itemKey]: {
      ...(state[itemKey] || {}),
      [mutationKey]: value,
    },
  };
}

export function clearMutationFlag(state, itemKey, mutationKey) {
  const nextEntry = {
    ...(state[itemKey] || {}),
    [mutationKey]: false,
  };

  const hasActiveMutation = Object.values(nextEntry).some(Boolean);

  if (hasActiveMutation) {
    return {
      ...state,
      [itemKey]: nextEntry,
    };
  }

  const nextState = { ...state };
  delete nextState[itemKey];
  return nextState;
}
