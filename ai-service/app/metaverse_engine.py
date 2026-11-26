from .schemas import MetaverseAnalysisRequest, MetaverseFinding


def _status(score: int) -> str:
    if score >= 70:
        return "CRITICAL"
    if score >= 45:
        return "WATCH"
    return "SECURE"


def analyze_metaverse(request: MetaverseAnalysisRequest) -> dict[str, object]:
    findings: list[MetaverseFinding] = []

    auth_score = int(
        (1 - request.authenticationConfidence) * 55
        + request.biometricDrift * 35
        + (1 if request.sessionMinutes > 480 else 0)
    )
    auth_score = min(100, auth_score)
    findings.append(MetaverseFinding(
        topic="Biometric continuous authentication",
        status=_status(auth_score),
        riskScore=auth_score,
        summary="Session identity should be revalidated continuously, especially after risk or drift events.",
        evidence=[
            f"Authentication confidence: {request.authenticationConfidence:.2f}",
            f"Biometric drift: {request.biometricDrift:.2f}",
            f"Session duration: {request.sessionMinutes} minutes",
        ],
        mitigations=["Step-up authentication", "Multi-sensor biometrics", "Session re-enrollment", "Behavioral liveness checks"],
    ))

    deepfake_score = int(request.deepfakeConfidence * 100)
    findings.append(MetaverseFinding(
        topic="Deepfake and avatar impersonation",
        status=_status(deepfake_score),
        riskScore=deepfake_score,
        summary="Avatar-media and voice signals indicate whether an identity may be synthetic or impersonated.",
        evidence=[f"Deepfake/impersonation confidence: {request.deepfakeConfidence:.2f}"],
        mitigations=["Signed avatar credentials", "Challenge-response liveness", "Voice-face consistency", "Mutual user verification"],
    ))

    ids_score = int(max(request.packetAnomalyScore * 75, request.deviceRiskScore * 65))
    findings.append(MetaverseFinding(
        topic="Metaverse intrusion detection",
        status=_status(ids_score),
        riskScore=ids_score,
        summary="Network and device telemetry are analyzed for anomalous movement, traffic, and session behavior.",
        evidence=[
            f"Packet anomaly: {request.packetAnomalyScore:.2f}",
            f"Device risk: {request.deviceRiskScore:.2f}",
            f"Environment: {request.environment.upper()}",
        ],
        mitigations=["XR runtime isolation", "Behavior baselines", "Real-time egress controls", "Host and network IDS"],
    ))

    twin_score = int((1 - request.twinIntegrityScore) * 100)
    findings.append(MetaverseFinding(
        topic="Digital-twin integrity",
        status=_status(twin_score),
        riskScore=twin_score,
        summary="Digital-twin state integrity is compared against the expected physical or virtual state.",
        evidence=[f"Integrity score: {request.twinIntegrityScore:.2f}"],
        mitigations=["Signed state snapshots", "Sensor consensus", "Immutable audit trail", "Out-of-band reconciliation"],
    ))

    nft_score = int(max(request.contractRiskScore * 70, request.nftSimilarityScore * 65, request.walletAnomalyScore * 80))
    findings.append(MetaverseFinding(
        topic="NFT, wallet, and smart-contract security",
        status=_status(nft_score),
        riskScore=nft_score,
        summary="Transaction, contract, wallet, and content signals are evaluated for spoofing or fraud.",
        evidence=[
            f"Contract risk: {request.contractRiskScore:.2f}",
            f"NFT similarity/plagiarism: {request.nftSimilarityScore:.2f}",
            f"Wallet anomaly: {request.walletAnomalyScore:.2f}",
        ],
        mitigations=["Contract verification", "Transaction allowlists", "NFT perceptual hashing", "Hardware wallet confirmation"],
    ))

    federated_score = int(request.federatedRoundVariance * 65 + (1 - request.participantTrustScore) * 35)
    findings.append(MetaverseFinding(
        topic="Federated edge learning",
        status=_status(federated_score),
        riskScore=federated_score,
        summary="Update variance and participant trust are used to detect unreliable edge-learning contributions.",
        evidence=[
            f"Update variance: {request.federatedRoundVariance:.2f}",
            f"Participant trust: {request.participantTrustScore:.2f}",
        ],
        mitigations=["Signed model updates", "Differential privacy", "Robust aggregation", "Poisoning detection", "Local minimization"],
    ))

    overall = int(sum(finding.riskScore for finding in findings) / len(findings))
    return {
        "overallRisk": overall,
        "overallStatus": _status(overall),
        "findings": [finding.model_dump() for finding in findings],
        "attackScenarios": [
            {
                "name": "Digital-twin data-integrity attack",
                "trigger": "Conflicting sensor state or manipulated twin snapshots",
                "response": "Quarantine the state update and require signed cross-source reconciliation.",
            },
            {
                "name": "Avatar impersonation with deepfake and MiTM",
                "trigger": "Low authentication confidence or synthetic media signals",
                "response": "Suspend privileged avatar actions and start identity re-verification.",
            },
            {
                "name": "NFT or cryptocurrency transaction phishing",
                "trigger": "Wallet anomaly, malicious contract, or deceptive marketplace content",
                "response": "Block transaction signing and require an allowlisted-domain confirmation.",
            },
        ],
    }
