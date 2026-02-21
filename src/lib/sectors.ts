// ============================================================
// SECTOR → ISSUE TYPE MASTER DATA
// ============================================================

import { Category, Team } from './types';

export interface IssueType {
    key: string;
    icon: string;
    /** Maps to legacy Category for backward compat */
    legacyCategory: Category;
    /** Maps to team for assignment */
    team: Team;
}

export interface Sector {
    key: string;
    icon: string;
    issueTypes: IssueType[];
}

// ============================================================
// SECTOR DEFINITIONS (exact order from requirements)
// ============================================================

export const SECTORS: Sector[] = [
    {
        key: 'roadsInfrastructure',
        icon: '🛣️',
        issueTypes: [
            { key: 'brokenRoadPothole', icon: '🕳️', legacyCategory: 'brokenRoad', team: 'roads' },
            { key: 'roadCollapse', icon: '⚠️', legacyCategory: 'brokenRoad', team: 'roads' },
            { key: 'bridgeSafetyIssue', icon: '🌉', legacyCategory: 'publicProperty', team: 'roads' },
            { key: 'publicPropertyDamage', icon: '🏛️', legacyCategory: 'publicProperty', team: 'general' },
            { key: 'landslideRisk', icon: '⛰️', legacyCategory: 'brokenRoad', team: 'roads' },
            { key: 'constructionDebris', icon: '🚧', legacyCategory: 'brokenRoad', team: 'roads' },
        ],
    },
    {
        key: 'waterSanitation',
        icon: '💧',
        issueTypes: [
            { key: 'waterLeakPipeBurst', icon: '🚰', legacyCategory: 'waterLeak', team: 'water' },
            { key: 'drinkingWaterShortage', icon: '💧', legacyCategory: 'waterLeak', team: 'water' },
            { key: 'garbageWaste', icon: '🗑️', legacyCategory: 'garbage', team: 'sanitation' },
            { key: 'mosquitoBreeding', icon: '🦟', legacyCategory: 'drainage', team: 'sanitation' },
            { key: 'publicToiletIssue', icon: '🚻', legacyCategory: 'drainage', team: 'sanitation' },
            { key: 'waterStagnation', icon: '🌊', legacyCategory: 'drainage', team: 'sanitation' },
        ],
    },
    {
        key: 'electricityLighting',
        icon: '⚡',
        issueTypes: [
            { key: 'streetlightNotWorking', icon: '💡', legacyCategory: 'streetlight', team: 'electricity' },
            { key: 'electricityIssue', icon: '⚡', legacyCategory: 'electricity', team: 'electricity' },
            { key: 'looseElectricWire', icon: '🔌', legacyCategory: 'electricity', team: 'electricity' },
            { key: 'transformerProblem', icon: '🔋', legacyCategory: 'electricity', team: 'electricity' },
            { key: 'poleDamage', icon: '🪵', legacyCategory: 'electricity', team: 'electricity' },
        ],
    },
    {
        key: 'healthSafety',
        icon: '🏥',
        issueTypes: [
            { key: 'dirtyHospital', icon: '🏨', legacyCategory: 'other', team: 'general' },
            { key: 'medicineShortage', icon: '💊', legacyCategory: 'other', team: 'general' },
            { key: 'equipmentNotWorking', icon: '🔧', legacyCategory: 'other', team: 'general' },
            { key: 'ambulanceDelay', icon: '🚑', legacyCategory: 'other', team: 'general' },
            { key: 'strayDogIssue', icon: '🐕', legacyCategory: 'other', team: 'general' },
            { key: 'publicSafetyHazard', icon: '🚨', legacyCategory: 'other', team: 'general' },
        ],
    },
    {
        key: 'educationChildServices',
        icon: '📚',
        issueTypes: [
            { key: 'brokenSchoolFurniture', icon: '🪑', legacyCategory: 'publicProperty', team: 'general' },
            { key: 'middayMealIssue', icon: '🍱', legacyCategory: 'other', team: 'general' },
            { key: 'unsafeSchoolBuilding', icon: '🏫', legacyCategory: 'publicProperty', team: 'general' },
            { key: 'drinkingWaterSchool', icon: '🚰', legacyCategory: 'waterLeak', team: 'water' },
            { key: 'anganwadiIssue', icon: '👶', legacyCategory: 'other', team: 'general' },
        ],
    },
    {
        key: 'publicFacilitiesTransport',
        icon: '🚌',
        issueTypes: [
            { key: 'busStopDamage', icon: '🚏', legacyCategory: 'publicProperty', team: 'general' },
            { key: 'noBusShelter', icon: '🏗️', legacyCategory: 'publicProperty', team: 'general' },
            { key: 'parkPlaygroundDamage', icon: '🏞️', legacyCategory: 'publicProperty', team: 'general' },
            { key: 'communityHallIssue', icon: '🏠', legacyCategory: 'publicProperty', team: 'general' },
            { key: 'marketCleanlinessIssue', icon: '🏪', legacyCategory: 'garbage', team: 'sanitation' },
            { key: 'libraryIssue', icon: '📖', legacyCategory: 'publicProperty', team: 'general' },
        ],
    },
    {
        key: 'panchayatServices',
        icon: '🏛️',
        issueTypes: [
            { key: 'birthCertificateDelay', icon: '📄', legacyCategory: 'other', team: 'general' },
            { key: 'deathCertificateDelay', icon: '📋', legacyCategory: 'other', team: 'general' },
            { key: 'buildingPermitDelay', icon: '🏗️', legacyCategory: 'other', team: 'general' },
            { key: 'tradeLicenseIssue', icon: '📝', legacyCategory: 'other', team: 'general' },
            { key: 'panchayatTaxIssue', icon: '💰', legacyCategory: 'other', team: 'general' },
            { key: 'officeServiceComplaint', icon: '🏢', legacyCategory: 'other', team: 'general' },
            { key: 'staffBehaviourComplaint', icon: '👤', legacyCategory: 'other', team: 'general' },
        ],
    },
    {
        key: 'socialWelfare',
        icon: '🤝',
        issueTypes: [
            { key: 'pensionDelay', icon: '👴', legacyCategory: 'other', team: 'general' },
            { key: 'rationCardIssue', icon: '🪪', legacyCategory: 'other', team: 'general' },
            { key: 'housingSchemeIssue', icon: '🏠', legacyCategory: 'other', team: 'general' },
            { key: 'welfareSchemeIssue', icon: '📑', legacyCategory: 'other', team: 'general' },
            { key: 'kudumbashreeIssue', icon: '👩‍👩‍👦', legacyCategory: 'other', team: 'general' },
            { key: 'disabilitySupportIssue', icon: '♿', legacyCategory: 'other', team: 'general' },
        ],
    },
    {
        key: 'agricultureEnvironment',
        icon: '🌿',
        issueTypes: [
            { key: 'irrigationIssue', icon: '🌾', legacyCategory: 'waterLeak', team: 'water' },
            { key: 'canalBlockage', icon: '🚫', legacyCategory: 'drainage', team: 'sanitation' },
            { key: 'treeFallDanger', icon: '🌳', legacyCategory: 'other', team: 'general' },
            { key: 'sandMiningComplaint', icon: '⛏️', legacyCategory: 'other', team: 'general' },
            { key: 'wasteBurningComplaint', icon: '🔥', legacyCategory: 'garbage', team: 'sanitation' },
            { key: 'waterSourcePollution', icon: '☠️', legacyCategory: 'waterLeak', team: 'water' },
        ],
    },
    {
        key: 'disasterEmergency',
        icon: '🚨',
        issueTypes: [
            { key: 'floodedRoad', icon: '🌊', legacyCategory: 'brokenRoad', team: 'roads' },
            { key: 'landslideAlert', icon: '⛰️', legacyCategory: 'brokenRoad', team: 'roads' },
            { key: 'fallenTrees', icon: '🌲', legacyCategory: 'other', team: 'general' },
            { key: 'electricLineDamage', icon: '⚡', legacyCategory: 'electricity', team: 'electricity' },
            { key: 'emergencyShelterRequest', icon: '🏕️', legacyCategory: 'other', team: 'general' },
            { key: 'reliefDistributionIssue', icon: '📦', legacyCategory: 'other', team: 'general' },
        ],
    },
    {
        key: 'other',
        icon: '📋',
        issueTypes: [
            { key: 'customIssue', icon: '✏️', legacyCategory: 'other', team: 'general' },
        ],
    },
];

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/** Get a sector by key */
export function getSectorByKey(key: string): Sector | undefined {
    return SECTORS.find(s => s.key === key);
}

/** Get issue types for a sector */
export function getIssueTypesForSector(sectorKey: string): IssueType[] {
    return getSectorByKey(sectorKey)?.issueTypes ?? [];
}

/** Find which sector an issue type belongs to */
export function getSectorForIssueType(issueTypeKey: string): Sector | undefined {
    return SECTORS.find(s => s.issueTypes.some(it => it.key === issueTypeKey));
}

/** Get the legacy Category for an issue type key */
export function issueTypeToCategory(issueTypeKey: string): Category {
    for (const sector of SECTORS) {
        const it = sector.issueTypes.find(t => t.key === issueTypeKey);
        if (it) return it.legacyCategory;
    }
    return 'other';
}

/** Get the Team for an issue type key */
export function issueTypeToTeam(issueTypeKey: string): Team {
    for (const sector of SECTORS) {
        const it = sector.issueTypes.find(t => t.key === issueTypeKey);
        if (it) return it.team;
    }
    return 'general';
}

/** Get display icon for an issue type */
export function getIssueTypeIcon(issueTypeKey: string): string {
    for (const sector of SECTORS) {
        const it = sector.issueTypes.find(t => t.key === issueTypeKey);
        if (it) return it.icon;
    }
    return '📋';
}

/** Get display icon for a sector */
export function getSectorIcon(sectorKey: string): string {
    return getSectorByKey(sectorKey)?.icon ?? '📋';
}
