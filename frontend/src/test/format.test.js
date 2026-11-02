import { describe, expect, it } from "vitest";
import { errorMessage } from "../api/client";
import { currency, hourLabel, NEXT_STATUS } from "../utils/format";

describe("format helpers", () => {
  it("formats rupees without paise", () => {
    expect(currency(1234.5)).toBe("₹1,235");
  });

  it("labels hours on a 12-hour clock", () => {
    expect(hourLabel(0)).toBe("12am");
    expect(hourLabel(13)).toBe("1pm");
  });

  it("walks the order lifecycle forward", () => {
    expect(NEXT_STATUS.pending).toBe("confirmed");
    expect(NEXT_STATUS.delivered).toBeUndefined();
  });
});

describe("errorMessage", () => {
  it("joins validation details", () => {
    const error = { response: { data: { error: { details: [{ message: "Name too short" }, { message: "Bad email" }] } } } };
    expect(errorMessage(error)).toBe("Name too short. Bad email");
  });

  it("explains network failures", () => {
    expect(errorMessage(new Error("Network Error"))).toBe("Cannot reach the server");
  });
});
