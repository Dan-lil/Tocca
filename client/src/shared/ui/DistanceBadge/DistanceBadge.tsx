interface DistanceBadgeProps {
  distanceKm: number;
}

export default function DistanceBadge({ distanceKm }: DistanceBadgeProps) {
  return (
    <span className="distance-badge">
      <svg
        className="distance-badge__icon"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
        />
      </svg>
      {distanceKm.toFixed(1)} км
    </span>
  );
}
