import type { Prisma, PrismaClient } from "@prisma/client";
import type { FindCandidatesInput, ProviderMatchCandidate, ProviderMatcher } from "@/domain/on-demand/provider-matcher";

const EARTH_RADIUS_KM = 6371;

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

// Great-circle distance — standard Haversine formula, no external
// geo library needed for point-to-point distance.
function haversineDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// v1 rule-based matcher (docs/06-smart-matching.md): candidates are
// providers offering the requested category, ACTIVE + VERIFIED +
// isAvailable, with at least one ProviderServiceArea whose radius covers
// the request point. Score favors closer + higher-rated providers with a
// simple deterministic formula — this is the real v1 algorithm, not a
// stand-in; a learned RankingAdjuster (ADR-005, Phase 3) can replace this
// class later without the on-demand use cases changing, since they only
// depend on the ProviderMatcher interface.
export class DistanceRatingProviderMatcher implements ProviderMatcher {
  constructor(private readonly prisma: PrismaClient) {}

  async findCandidates(input: FindCandidatesInput): Promise<ProviderMatchCandidate[]> {
    const providerCategories = await this.prisma.providerCategory.findMany({
      where: {
        categoryId: input.categoryId,
        providerId: input.excludeProviderIds?.length ? { notIn: input.excludeProviderIds } : undefined,
        provider: {
          status: "ACTIVE",
          verificationStatus: "VERIFIED",
          isAvailable: true,
        },
      },
      include: {
        provider: {
          include: { serviceAreas: true },
        },
      },
    });

    const candidates: ProviderMatchCandidate[] = [];

    for (const providerCategory of providerCategories) {
      const provider = providerCategory.provider;
      let nearestDistanceKm: number | null = null;

      for (const area of provider.serviceAreas) {
        const distanceKm = haversineDistanceKm(input.lat, input.lng, area.centerLat, area.centerLng);
        if (distanceKm <= area.radiusKm && (nearestDistanceKm === null || distanceKm < nearestDistanceKm)) {
          nearestDistanceKm = distanceKm;
        }
      }

      if (nearestDistanceKm === null) {
        continue;
      }

      const score = provider.ratingAverage * 20 - nearestDistanceKm;
      candidates.push({ providerId: provider.id, score, distanceKm: nearestDistanceKm });
    }

    candidates.sort((a, b) => b.score - a.score);
    const limited = candidates.slice(0, input.limit ?? candidates.length);

    if (limited.length > 0) {
      await this.prisma.matchingScoreLog.createMany({
        data: limited.map((candidate) => ({
          requestId: input.requestId,
          providerId: candidate.providerId,
          score: candidate.score,
          factors: { distanceKm: candidate.distanceKm } as Prisma.InputJsonValue,
        })),
      });
    }

    return limited;
  }
}
