export const changeCount = (data: boolean) => {
  return {
    type: "CHANGE_LOAD" as const,
    data,
  };
};

export type CountAction = ReturnType<typeof changeCount>;
