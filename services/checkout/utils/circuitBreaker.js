const STATES = { CLOSED: 'CLOSED', OPEN: 'OPEN', HALF_OPEN: 'HALF_OPEN' };

class CircuitBreaker {
  constructor(name, { failureThreshold = 5, successThreshold = 2, timeout = 30000 } = {}) {
    this.name = name;
    this.state = STATES.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
    this.failureThreshold = failureThreshold;
    this.successThreshold = successThreshold;
    this.timeout = timeout;
  }

  async call(fn) {
    if (this.state === STATES.OPEN) {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        const err = new Error(`Service ${this.name} unavailable (circuit open)`);
        err.code = 'CIRCUIT_OPEN';
        throw err;
      }
      this.state = STATES.HALF_OPEN;
    }

    try {
      const result = await fn();
      this._onSuccess();
      return result;
    } catch (err) {
      this._onFailure();
      throw err;
    }
  }

  _onSuccess() {
    this.failureCount = 0;
    if (this.state === STATES.HALF_OPEN) {
      this.successCount += 1;
      if (this.successCount >= this.successThreshold) {
        this.state = STATES.CLOSED;
        this.successCount = 0;
      }
    }
  }

  _onFailure() {
    this.failureCount += 1;
    this.lastFailureTime = Date.now();
    if (this.state === STATES.HALF_OPEN || this.failureCount >= this.failureThreshold) {
      this.state = STATES.OPEN;
      this.successCount = 0;
    }
  }

  getState() {
    return { name: this.name, state: this.state, failureCount: this.failureCount };
  }
}

module.exports = CircuitBreaker;
