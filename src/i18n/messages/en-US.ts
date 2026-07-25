/**
 * English (US) messages.
 *
 * Deliberately `Partial`: any key missing here falls back to the pt-BR
 * catalogue, which is the reference locale. That keeps a half-finished
 * translation shippable — a missing string shows in Portuguese rather than
 * rendering a raw key or an empty element.
 *
 * The interface strings are translated. The longer methodological prose is not
 * yet, and falls back on purpose: a bad translation of a caveat about
 * normative weights is worse than an untranslated one.
 */

import type { Messages } from "./pt-BR";

export const enUS: Partial<Messages> = {
  "app.fullName": "Healthcare Travel Impact Visualiser",
  "app.tagline": "What does getting to a medical appointment really cost?",
  "nav.methodology": "How we calculate",
  "nav.skipToContent": "Skip to main content",

  "form.title": "Describe the journey",
  "form.origin.label": "Where the person starts",
  "form.origin.placeholder": "City, hospital, or coordinates",
  "form.destination.label": "Where they are going",
  "form.destination.placeholder": "Hospital or health facility",
  "form.searching": "Searching…",
  "form.noResults": "No place found. Try another term, or use coordinates.",
  "form.selected": "Selected",
  "form.clear": "Clear",

  "form.modal.label": "How they travel",
  "form.modal.car_gasoline": "Car (petrol)",
  "form.modal.car_ethanol": "Car (ethanol)",
  "form.modal.motorcycle": "Motorcycle",
  "form.modal.bus_urban": "City bus",
  "form.modal.metro_rail": "Metro or train",
  "form.modal.taxi_rideshare": "Taxi or ride-hailing",
  "form.modal.bicycle": "Bicycle",
  "form.modal.walking": "Walking",

  "form.trip.title": "Journey details",
  "form.occupancy.label": "People in the vehicle",
  "form.transfers.label": "Transfers on the way there",
  "form.toll.label": "Toll per leg",
  "form.parking.label": "Parking for the visit",
  "form.congestion.label": "Traffic conditions",
  "form.congestion.typical": "Typical day",
  "form.congestion.busy": "Busy",
  "form.congestion.heavy": "Rush hour",

  "form.profile.title": "Profile of the person travelling",
  "form.age.label": "Age",
  "form.mobility.label": "Mobility",
  "form.mobility.none": "No limitation",
  "form.mobility.mild": "Walks, but tires easily",
  "form.mobility.moderate": "Uses a cane, walker, or support",
  "form.mobility.severe": "Wheelchair or bedbound",
  "form.companion.label": "Needs a companion",
  "form.income.label": "Monthly household income",
  "form.income.placeholder": "Optional",
  "form.productivity.label": "Missing work reduces income",
  "form.internet.label": "Has reliable internet at home",

  "form.submit": "Calculate impact",
  "form.calculating": "Calculating…",
  "form.reset": "Start over",
  "form.error.title": "Could not calculate",
  "form.error.missingPlaces": "Choose an origin and a destination.",

  "results.title": "Result",
  "results.inPerson": "In person",
  "results.remote": "Teleconsultation",
  "results.difference": "Difference",
  "results.summary.label": "Summary",
  "results.scenarioCompare": "Scenario comparison",
  "results.emptyTitle": "Nothing calculated yet",

  "summary.saved": "With a teleconsultation, you save {list}.",
  "summary.wouldSave": "A teleconsultation would save {list}.",
  "summary.equivalent":
    "In this case, a teleconsultation and an in-person appointment have equivalent impact.",
  "summary.and": "and",
  "summary.ofCarbon": "of CO₂",

  "index.carbon": "Carbon footprint",
  "index.time": "Total time",
  "index.cost": "Cost",
  "index.burden": "Travel burden",
  "index.social": "Social impact",

  "index.expand": "See how we calculate this",
  "index.collapse": "Hide the calculation",
  "index.components": "Composition",
  "index.inputs": "Calculation inputs",
  "index.formula": "Formula",
  "index.sources": "Sources",
  "index.caveats": "Caveats",
  "index.uncertainty": "Estimated range",
  "index.component": "Component",
  "index.value": "Value",
  "index.weight": "Weight",
  "index.contribution": "Contribution",

  "journey.title": "The journey",
  "journey.home": "Home",
  "journey.travel": "Travel",
  "journey.wait": "Waiting",
  "journey.consultation": "Appointment",
  "journey.return": "Journey home",
  "journey.remoteConnect": "Connects from home",

  "scientist.toggle": "Scientist Mode",
  "scientist.rawRoute": "Route data",
  "scientist.provider": "Provider",
  "scientist.confidence": "Confidence",
  "scientist.confidence.low": "low",
  "scientist.confidence.medium": "medium",
  "scientist.confidence.high": "high",
  "scientist.distance": "Distance (one way)",
  "scientist.duration": "Time (one way)",
  "scientist.indexVersion": "Index version",
  "scientist.dataTable": "Chart data table",

  "export.title": "Export",
  "export.json": "Download JSON",
  "export.csv": "Download CSV",

  "methodology.title": "How we calculate",
  "methodology.version": "Index version",
  "methodology.parameter": "Parameter",
  "methodology.range": "Range",
  "methodology.unit": "Unit",
  "methodology.source": "Source",
  "methodology.note": "Note",
  "methodology.sourcesTitle": "References",
  "methodology.backToCalculator": "Back to the calculator",

  "footer.api": "API",
};
