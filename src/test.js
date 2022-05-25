export class Test {
  testSucceeded = false;

  constructor(description) {
    this.description = description;
  }

  fail(error) {
    this.error = error;
  }

  success() {
    this.testSucceeded = true;
  }

  print() {
    console.log(`${this.testSucceeded ? "✅" : "❌"} ${this.description}`);
    if (!this.testSucceeded) {
      console.log(this.error);
    }
  }
}
