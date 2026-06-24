type Tab = "home" | "vault" | "goals" | "borrow" | "challenges" | "account";

let tabSetter: ((tab: Tab) => void) | null = null;
let registeredCount = 0;

export function registerTabSetter(setter: (tab: Tab) => void) {
  tabSetter = setter;
  registeredCount++;
  return () => {
    registeredCount--;
    if (registeredCount === 0) {
      tabSetter = null;
    }
  };
}

export function useNavigate() {
  const goTo = (tab: Tab) => tabSetter?.(tab);

  return {
    goToHome: () => goTo("home"),
    goToVault: () => goTo("vault"),
    goToGoals: () => goTo("goals"),
    goToBorrow: () => goTo("borrow"),
    goToChallenges: () => goTo("challenges"),
    goToAccount: () => goTo("account"),
  };
}
