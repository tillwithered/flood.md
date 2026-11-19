import {forwardRef} from "react";
import {Badge, Button, IconSlot, Menu, type EnvironmentOption, type EnvironmentSwitcherProps, type MenuRadioItem} from "./index.js";

const optionName = ({label, scope}: EnvironmentOption) => scope ? `${label} · ${scope.label}` : label;

export const EnvironmentSelector = /* @__PURE__ */ forwardRef<HTMLDivElement, EnvironmentSwitcherProps>(
  function EnvironmentSelector({
    label, environments, value, onValueChange, placeholder, size, variant, disabled, className, ...props
  }, ref) {
    const active = environments.find(environment => environment.id === value);
    const unavailable = disabled || environments.every(environment => environment.disabled);
    const items: MenuRadioItem[] = environments.map(environment => ({
      id: environment.id,
      type: "radio",
      group: "environment",
      label: optionName(environment),
      icon: environment.icon,
      disabled: environment.disabled,
      checked: active?.id === environment.id,
      closeOnSelect: true,
      onCheckedChange: () => onValueChange(environment.id),
    }));

    return <div {...props} ref={ref} className={["flood-environment-switcher", className].filter(Boolean).join(" ")}>
      <Menu label={label} items={items} controlSize={size} disabled={unavailable}
        trigger={trigger => <Button {...trigger} size={size} variant={variant}
          title={active ? optionName(active) : undefined} className="flood-environment-switcher__trigger">
          {active?.icon && <IconSlot size={size}>{active.icon}</IconSlot>}
          <span className="flood-environment-switcher__name">{active?.label ?? placeholder}</span>
          {active?.scope && <>{" "}<Badge size="sm" tone={active.scope.tone} className="flood-environment-switcher__scope">{active.scope.label}</Badge></>}
          <IconSlot size={size} className="flood-environment-switcher__chevron">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </IconSlot>
        </Button>} />
    </div>;
  },
);
