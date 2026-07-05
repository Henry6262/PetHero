import { useMemo } from "react";
import { generateProps } from "../../lib/props";
import { createCarGroup } from "../../lib/car";
import type { Building } from "../../types/data";

export default function CarLayer({ buildings }: { buildings: Building[] }) {
  const cars = useMemo(() => generateProps(buildings).cars, [buildings]);

  return (
    <>
      {cars.map((car, i) => {
        const group = createCarGroup(car.color);
        group.position.copy(car.position);
        group.rotation.set(0, car.rotation, 0);
        group.scale.copy(car.scale);
        return <primitive key={i} object={group} />;
      })}
    </>
  );
}
