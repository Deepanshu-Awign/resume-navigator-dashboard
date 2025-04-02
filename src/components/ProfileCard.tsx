
import { ResumeProfile } from "@/types";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface ProfileCardProps {
  profile: ResumeProfile;
  index: number;
}

const ProfileCard = ({ profile, index }: ProfileCardProps) => {
  const statusColorMap = {
    New: "bg-blue-100 text-blue-800",
    Shortlisted: "bg-green-100 text-green-800",
    Rejected: "bg-red-100 text-red-800",
  };

  return (
    <Link to={`/profile/${profile.id}`} state={{ profile }}>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="py-4 flex flex-row justify-between items-center">
          <h3 className="font-medium text-lg">{profile.name}</h3>
          <Badge className={statusColorMap[profile.status]}>
            {profile.status}
          </Badge>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-gray-600">{profile.email}</p>
          <p className="text-sm text-gray-500 mt-2">Job ID: {profile.jobId}</p>
        </CardContent>
      </Card>
    </Link>
  );
};

export default ProfileCard;
