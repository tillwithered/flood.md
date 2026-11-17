import {forwardRef} from "react";
import {Badge, CopyableValue, DescriptionList, Inline, Section, StatusIndicator, Text, type DomainVerificationProps} from "./index.js";

export const DomainVerificationPanel = /* @__PURE__ */ forwardRef<HTMLElement, DomainVerificationProps>(
  function DomainVerificationPanel({
    domain, records, status, action, labels, className, ...props
  }, ref) {
    const nameLabel = labels?.name ?? "Name";
    const valueLabel = labels?.value ?? "Value";
    if (!domain.trim() || records.some(record => !record.id.trim() || !record.type.trim() || !record.name.trim()) ||
      new Set(records.map(record => record.id)).size !== records.length) {
      throw new Error("Flood DomainVerification requires a named domain and unique, named DNS records");
    }

    return <Section {...props} ref={ref} title={domain} className={["flood-domain-verification", className].filter(Boolean).join(" ")}
      actions={(status || action) && <Inline gap="3" align="center">
        {status && <StatusIndicator {...status} presentation="wrap" />}
        {action}
      </Inline>}>
      {records.length ? <ul className="flood-domain-verification__records" role="list" aria-label={labels?.records ?? "DNS records"}>
        {records.map(record =>
          <li key={record.id}>
            <div className="flood-domain-verification__record" role="group" aria-label={`${record.type} ${record.name}`}>
              <Inline gap="2" align="center">
                <Badge size="sm" variant="outline">{record.type}</Badge>
                {record.status && <StatusIndicator {...record.status} presentation="wrap" size="sm" />}
              </Inline>
              <DescriptionList layout="columns" items={[
                {id:"name", term:nameLabel, description:<CopyableValue appearance="code" value={record.name}
                  copyLabel={labels?.copyName?.(record) ?? `Copy ${record.type} record name`} />},
                {id:"value", term:valueLabel, description:<CopyableValue appearance="code" value={record.value}
                  copyLabel={labels?.copyValue?.(record) ?? `Copy ${record.type} record value`} />},
              ]} />
            </div>
          </li>
        )}
      </ul> : <Text tone="subtle" size="compact">{labels?.empty ?? "No DNS records required."}</Text>}
    </Section>;
  },
);
