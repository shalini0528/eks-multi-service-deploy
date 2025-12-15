# Security Policy

Thank you for helping keep this project and its users safe. This document explains how to report vulnerabilities and how we handle security issues for this repository.

---

## 🚨 Reporting a Vulnerability

If you believe you’ve found a security vulnerability, **please do not open a public issue**. Instead, email us at:

**shalikularathne93@gmail.com**

Include:
- A clear description of the issue, impact, and affected components
- Steps to reproduce (PoC), logs, and screenshots if applicable
- Any suggested remediation or references
- Your contact details for follow-up

> If you prefer encryption, share your public PGP key in the initial email and we’ll respond with an encrypted channel.

We aim to acknowledge receipt **within 3 business days** and provide an initial assessment **within 7 business days**.

---

## 🔒 Coordinated Disclosure

We follow a responsible disclosure model:
- We work privately with you to verify, reproduce, and fix the issue.
- We target a public disclosure and fix release within **90 days** of triage. Complex issues may require extensions; we’ll coordinate timelines with you.
- We credit reporters in the release notes if desired.

We do **not** operate a paid bug bounty program at this time.

---

## 🎯 Scope

This repository contains infrastructure and deployment assets for running a multi-service stack on **AWS EKS** (ingress, deployments, Helm, monitoring). Issues in scope include (examples, not exhaustive):

- Misconfigurations leading to privilege escalation (e.g., overly broad IAM roles, lack of IRSA)
- Insecure defaults in Kubernetes manifests (e.g., privileged containers, hostPath volumes, `runAsRoot`, missing readOnlyRootFilesystem)
- Ingress/Service exposure that allows unintended public access
- Weak or missing authentication/authorization controls in provided examples
- Supply-chain risks in container build pipeline (e.g., pulling images over HTTP, unpinned tags)
- Sensitive data exposure (hardcoded secrets, credentials in repo or manifests)
- TLS/mTLS configuration weaknesses for components in this stack

### Out of scope

- Denial-of-service (volumetric) and rate-limiting tests
- Social engineering, phishing, or physical security
- Issues requiring privileged access that the project does not grant
- Vulnerabilities exclusively in third‑party dependencies without a demonstrable impact on this project’s configuration
- Findings based solely on version strings without a working exploit or clear impact

---

## 🧪 Responsible Testing Guidelines

- Do **not** run tests against other users’ environments or AWS accounts.
- Only test in your **own** sandbox or in a controlled environment you own.
- Do **not** exfiltrate data. Use non-sensitive test data.
- Avoid excessive traffic or resource consumption against shared/public infrastructure.

If in doubt, contact us first: **shalikularathne93@gmail.com**.

---

## 🔄 Triage & Remediation Process

1. **Acknowledge** report (≤ 3 business days).
2. **Triage** and assess severity (≤ 7 business days) using CVSS 3.1 where applicable.
3. **Fix**: develop and validate a patch or configuration change.
4. **Release**: publish updates and documentation.
5. **Credit**: thank the reporter (opt-in) in changelog/release notes.

---

## ✅ Supported Versions

We maintain security updates for the currently published public branch and latest tags.

| Version / Branch | Status          |
|------------------|-----------------|
| `public`         | ✅ Supported    |
| latest `v1.x`    | ✅ Supported    |
| `< v1.0`         | ❌ Not supported |

> For Kubernetes/EKS compatibility, always use a supported EKS version and the latest stable `kubectl`, `eksctl`, and Helm.

---

## 🛡️ Security Hardening Recommendations

While this repo provides examples, production deployments should consider:

- **IAM & IRSA**: Use fine‑grained IAM roles for service accounts (IRSA). Avoid attaching broad policies to nodes.
- **Secrets**: Store secrets in **Kubernetes Secrets** backed by a KMS provider (e.g., AWS KMS via Secrets Store CSI), not in plaintext manifests. Rotate regularly.
  - **Current Status**: Analytics service code no longer has hardcoded passwords as fallbacks. However, deployment manifests still contain credentials in environment variables—these should be migrated to Kubernetes Secrets in production.
- **Images**: Use pinned, minimal base images and scan with tools like `trivy`/`grype`. Enable signature verification (e.g., Cosign) if possible.
- **Network**: Add NetworkPolicies to restrict pod‑to‑pod traffic. Limit Service exposure to public internet.
- **Runtime**: Set restrictive `securityContext` (`runAsNonRoot`, `readOnlyRootFilesystem`, drop capabilities). Avoid `hostNetwork`, `hostPID`, or privileged containers.
- **Ingress/TLS**: Terminate TLS with AWS Load Balancer Controller or NGINX Ingress; use HTTPS-only listeners.
- **Monitoring**: Use Prometheus alerts and log aggregation for anomaly detection.
- **Upgrades**: Keep cluster, ingress controller, and Helm charts updated. Apply security patches promptly.
- **Dependencies**: Regularly audit and update npm packages. The project uses `npm ci` for reproducible builds with locked dependency versions.

---

## 🔐 Handling Exposed Secrets

If you discover credentials or secrets in this repo or related images:
1. **Do not** use them.
2. Report privately to **shalikularathne93@gmail.com**.
3. We will rotate/revoke the credentials and update the history as needed.

---

## 📦 Dependencies & Supply Chain

- We track vulnerabilities in base images and dependencies via container scanning.
- Please report dependency CVEs that affect this project’s default configuration.
- SBOMs can be generated with tools like **Syft** and scanned with **Grype** or **Trivy**.

---

## ⚖️ Safe Harbor

We will not initiate legal action against researchers who:
- Make a good‑faith effort to follow this policy;
- Avoid privacy violations, data destruction, and service disruption;
- Report vulnerabilities promptly and do not exploit them beyond what is necessary to demonstrate impact;
- Give us a reasonable time to remediate before public disclosure.

---

## 🙏 Recognition

With your permission, we will acknowledge your contribution in the project’s release notes and/or a `SECURITY-THANKS.md`.

---

_Last updated: 2025-08-13_
