import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/common/Button";

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeDefined();
  });

  it("shows loading spinner when loading", () => {
    const { container } = render(<Button loading>Save</Button>);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeDefined();
  });

  it("disables when loading", () => {
    render(<Button loading>Save</Button>);
    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
  });

  it("disables when disabled prop is set", () => {
    render(<Button disabled>Save</Button>);
    expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true);
  });
});
