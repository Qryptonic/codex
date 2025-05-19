# QStrike™ 5.1.61 Quantum Penetration Testing Dashboard

## What is QStrike™?
QStrike™ is an enterprise-grade, hybrid HPC–Quantum penetration testing framework. It combines classical high-performance computing (HPC) partial-sieve techniques with on-demand quantum subroutines to break cryptographic keys significantly faster than either approach alone. It is designed to anticipate real-world ephemeral leaks, unify classical and quantum compute, and provide a clear path to post-quantum readiness.

## Core Concepts (from White Paper & Addendum)
1. **White-Box vs. Black-Box Testing**: QStrike assumes partial key material (ephemeral leaks) is available and uses it to collapse the cryptanalytic search space.
2. **Ephemeral-Leak Exploitation**: Even 32–128 bits leaked can turn infeasible attacks into practical ones.
3. **HPC Partial-Sieve Mechanics**: Classical clusters enumerate prime/subkey candidates, reducing hundreds of thousands to tens of thousands in hours.
4. **Quantum Annealing & QUBO Reformulation**: Map factoring to QUBO for pruning on annealers like D-Wave.
5. **Gate-Model Finishing (Shor & Grover)**: Use universal processors for final factoring/key search.
6. **HPC–Quantum Overlap & 18% Speedup**: Parallel execution yields ~18% speedup over sequential.
7. **QryAI Orchestration Logic**: AI engine routes sub-tasks to optimal provider based on real-time metrics.
8. **Multi-Cloud Provider Ecosystem**: Integrates 8+ vendors for diverse hardware strengths.
9. **Provider Profiles & Tech Types**: Know each platform's qubit counts, architectures, and error characteristics.
10. **Error Rates & Fault Tolerance**: Shor's factoring demands ≥99.9% two-qubit fidelity.
11. **Real-World Benchmarks**: Example: RSA-768 with a 128-bit leak completes in ~29h (overlapped).
12. **Dashboard JSON Schema**: Field names like `hpc.partial_sieve`, `quantum_runs`, `qryai.decisions`, `pqc_tests`, `alerts` drive visualizations.
13. **Key Performance Indicators**: Progress %, ETA, stage, candidates, queue, success, alerts, leaks, findings.
14. **Post-Quantum Cryptography (PQC) Testing**: Attack lattice-based schemes under ephemeral-leak scenarios.
15. **Pricing & Cost Models**: Understand provider pricing models.
16. **Alerting & Fidelity Thresholds**: Flag fidelity dips and SLA breaches.
17. **Visual Dashboard Principles**: Use Splunk-style 3×3 cards, Sankey flows, Gantt timelines, progress bars, animated counters.
18. **Enterprise Roadmap & Remediation**: Immediate, mid-term, and long-term actions for clients.
19. **Competitive Landscape & $1M Challenge**: Position QStrike's ephemeral approach against competitors; $1M payout for leak-free clients.
20. **Compliance & Regulatory Alignment**: Align with NIST, ISO 27001, ENISA, NSA CNSA 2.0, PCI DSS 4.0.

## 3×3 SOC Dashboard Grid (Critical KPIs)
| Position | Card Title                  | JSON Field(s)                                               | Why It Matters |
|:--------:|:---------------------------|:------------------------------------------------------------|:---------------|
| 1        | Test Progress (%)           | (now – timestamp_start) / overall_duration_sec              | Shows pipeline progress |
| 2        | Elapsed / ETA               | timestamp_start, overall_duration_sec                       | Elapsed time vs. projected finish |
| 3        | Current Stage               | Derived from timestamps vs. hpc.partial_sieve & quantum_runs| Labels "HPC Sieve → Annealer → Gate-Model" |
| 4        | Candidates Remaining        | hpc.partial_sieve.candidates_after_prune                    | How many factor‐candidates still in play |
| 5        | Active Provider & Queue     | quantum_runs[active].provider, queue_time_sec               | Which QPU is live and its current wait |
| 6        | Aggregate Success Rate (%)  | Weighted avg of quantum_runs[].success_rate_pct             | Reliability of completed quantum sub-tasks |
| 7        | Critical Alerts             | Count of alerts[level=="critical"]                         | Immediate failures or drops in fidelity |
| 8        | Ephemeral Leaks Detected    | Count of leaks from pqc_tests[].ephemeral_leak_bits > 0     | Number of partial‐key leaks exploited |
| 9        | High-Severity Findings      | Count of confirmed vuln. events (e.g. RSA bits factored)    | Total cryptographic breaks identified |

## Dashboard Visual & UX Principles
- **Cyberpunk, but Clean:** Neon glows, animated gridlines, digital fonts for key metrics, but data is always front and center.
- **Splunk-Style Functionality:** 3×3 grid, animated counters, progress bars, Sankey flows for QryAI decisions, Gantt timelines.
- **Contextual Tooltips:** Every card and metric has a tooltip or info icon with a plain-language explanation.
- **Real-Time Updates:** Poll JSON every 30s, animate value changes.
- **Accessibility:** High contrast, keyboard navigation, ARIA labels.
- **Compliance Badges:** Display NIST, ISO, ENISA, PCI, etc. status.
- **Export/Share:** Option to export grid as PDF/CSV.

## QStrike™ Workflow
1. **HPC Partial-Sieve**: Enumerate candidates.
2. **Annealer-Based Pruning**: Prune with quantum annealer.
3. **Gate-Model Finishing**: Final factoring/key search on gate-based QPUs.
- **QryAI** orchestrates all phases, routing tasks for optimal speed and reliability.

## Roadmap for Future Teams
- **Immediate:** Sanitize logs, isolate HPC tenants, purge ephemeral data.
- **Mid-Term:** Pilot PQC under leak conditions, tune QryAI.
- **Long-Term:** Full PQC rollout, annual retests.

## $1 Million Challenge
Clients who pass QStrike's ephemeral-focused testing without a single leak get a hypothetical $1M payout—underscoring how pervasive these vulnerabilities are in practice.

## Contact & Attribution
- For more details, see the full White Paper and Addendum in the project root.
- Dashboard and framework by QStrike™ SOC Engineering Team.

---

**This README is designed to preserve all critical knowledge for future developers, SOC teams, and auditors.** 