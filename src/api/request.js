function handleError(error) {
  const message = error?.response?.data?.message || "요청 실패";
  const err = new Error(message);
  err.status = error?.response?.status;
  return err;
}

async function request(run) {
  try {
    return await run();
  } catch (error) {
    throw handleError(error);
  }
}

export { handleError, request };
