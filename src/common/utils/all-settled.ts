enum StatusEnum {
  Fulfilled = "fulfilled",
  Rejected = "rejected",
}

type Status = `${StatusEnum}`;

class AllSettled<T = unknown> {
  private constructor(
    private readonly fulfilled: T[],
    private readonly rejected: unknown[],
  ) {}

  /**
   * Creates an AllSettled instance from an array of promises.
   *
   * @param {Promise<T>[]} promises The promises to settle.
   * @returns {Promise<AllSettled<T>>} The AllSettled instance.
   */
  static async from<T>(promises: Promise<T>[]): Promise<AllSettled<T>> {
    const results: PromiseSettledResult<T>[] =
      await Promise.allSettled(promises);

    /**
     * Filters the results by status.
     *
     * @param {PromiseSettledResult<T>[]} results The results to filter.
     * @param {Status} status The status to filter by.
     * @returns {T[]} The filtered results.
     */
    const filterStatus = (
      results: PromiseSettledResult<T>[],
      status: Status,
    ): T[] =>
      results
        .filter((result: PromiseSettledResult<T>) => result.status === status)
        .map((result: PromiseFulfilledResult<T>) => result.value);
    // Extract fulfilled and rejected results.
    const fulfilled: T[] = filterStatus(results, StatusEnum.Fulfilled);
    const rejected: unknown[] = filterStatus(results, StatusEnum.Rejected);
    return new AllSettled(fulfilled, rejected);
  }

  /**
   * Returns true if all promises were fulfilled.
   *
   * @returns {boolean} True if all promises were fulfilled.
   */
  success(): boolean {
    return this.rejected.length === 0;
  }

  /**
   * Returns true if at least one promise was rejected.
   *
   * @returns {boolean} True if at least one promise was rejected.
   */
  hasFailures(): boolean {
    return this.rejected.length > 0;
  }

  /**
   * Returns the results of the fulfilled promises.
   *
   * @returns {T[]} The results of the fulfilled promises.
   */
  results(): T[] {
    return this.fulfilled;
  }

  /**
   * Returns the errors of the rejected promises.
   *
   * @returns {unknown[]} The errors of the rejected promises.
   */
  errors(): unknown[] {
    return this.rejected;
  }
}

export default AllSettled;
export { AllSettled };
