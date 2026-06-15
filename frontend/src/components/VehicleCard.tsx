import { getImageUrl } from "../servicos/api";
// @ts-ignore
import "../styles/VehicleCard.css";
import { IVehicle } from "../types";

interface VehicleCardProps {
  vehicle: IVehicle;
  onClick: () => void;
}

export default function VehicleCard({ vehicle, onClick }: VehicleCardProps) {
  const thumb = vehicle.images?.[0]?.url
    ? getImageUrl(vehicle.images[0].url)
    : null;

  const price = Number(vehicle.price).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div className="vehicle-card" onClick={onClick}>
      <div className="vehicle-card-img-box">
        <img
          src={thumb || "/fallback-autozoom.png"}
          alt={`${vehicle.brand} ${vehicle.model}`}
          className="vehicle-card-img"
          onError={(e: any) => {
            e.target.onerror = null;
            e.target.src = "/fallback-autozoom.png";
          }}
        />

        <span className="vehicle-card-badge">
          {vehicle.manufactureYear}/{vehicle.modelYear}
        </span>
      </div>

      <div className="vehicle-card-body">
        <h3 className="vehicle-card-title">
          {vehicle.brand} {vehicle.model}
        </h3>

        <p className="vehicle-card-sub">
          {vehicle.location} · {vehicle.mileage?.toLocaleString("pt-BR")} km
        </p>

        <p className="vehicle-card-engine">
          {vehicle.engine} · {vehicle.transmission}
        </p>

        <div className="vehicle-card-footer">
          <span className="vehicle-card-price">{price}</span>
          <span className="vehicle-card-seller">
            {vehicle.user?.name?.split(" ")[0] ||
              vehicle.Buyer?.name?.split(" ")[0] ||
              "Vendedor"}
          </span>
        </div>
      </div>
    </div>
  );
}
