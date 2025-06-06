# Proposal System Overview

This document outlines how player submitted proposals are reviewed within RPG Scribe.

## Workflow

1. **Submission** – Players create proposals using the UI. Each proposal is stored under `proposals/{proposalId}` in Firestore with a `submittedBy` user id and timestamp.
2. **Review** – Game Masters open the proposal list to review pending items. They can approve or reject individual proposals. Approved or rejected proposals record the reviewer and review time.
3. **Implementation** – Approved proposals are applied to campaign data in future updates (not yet automated).

## Comment Guidelines

- Keep feedback concise and specific so players understand any changes made by the GM.
- Provide reasons when rejecting a proposal to encourage constructive collaboration.
