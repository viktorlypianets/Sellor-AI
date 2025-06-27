import WeeklyTrend from "./InsightComponent/WeeklyTrend";
import Summary from "./InsightComponent/Summary";
import Unanswerd from "./InsightComponent/Unanswer";
import MostViewed from "./InsightComponent/MostViewed";

export default function Insights() {
  return (
    <div style={{ width: "80%" }}>
      <div style={{ display: "flex", gap: "40px" }}>
        <Summary />
        <WeeklyTrend />
      </div>
      <MostViewed />
      <Unanswerd />
    </div>
  );
}
