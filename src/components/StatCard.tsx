
import { Link } from "react-router-dom";

interface StatCardProps {
  title: string;
  count: number;
  color: string;
  onClick: () => void;
}

const StatCard = ({ title, count, color, onClick }: StatCardProps) => {
  return (
    <div 
      onClick={onClick}
      className={`card-dashboard cursor-pointer ${color} flex flex-col items-center justify-center transition-transform hover:scale-105`}
    >
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-3xl font-bold">{count}</p>
    </div>
  );
};

export default StatCard;
