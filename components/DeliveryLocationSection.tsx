import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  requestForegroundLocation,
  type RequestForegroundLocationResult,
} from "../lib/requestForegroundLocation";
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  parseServerAddressId,
  setDefaultAddress,
  type ApiAddress,
  type AddressType,
  type CreateAddressPayload,
} from "../services/addresses";
import {
  type ApiCountryRow,
  type ApiStateRow,
  fetchCities,
  fetchCountries,
  fetchPincodes,
  fetchStates,
  toUniqueCityNames,
  toUniqueCountryNames,
  toUniquePincodes,
  toUniqueStateNames,
} from "../services/location";

/** Must match `home.tsx` so the same saved list and selection apply app-wide. */
export const DELIVERY_ADDRESSES_STORAGE_KEY = "home_savedDeliveryAddresses_v1";
const DELIVERY_SELECTED_ADDRESS_ID_STORAGE_KEY =
  "home_selectedDeliveryAddressId_v1";
const DELIVERY_SELECTED_ADDRESS_LINE_STORAGE_KEY =
  "home_selectedDeliveryAddressLine_v1";

export interface SavedDeliveryAddress {
  id: string;
  name: string;
  line: string;
  phone?: string;
  email?: string;
  username?: string;
  /** Present when row came from `GET /api/addresses` (see `enableFullAddressApi`). */
  isDefault?: boolean;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  addressType?: string;
}

const DEFAULT_SAVED_DELIVERY_ADDRESSES: SavedDeliveryAddress[] = [
  {
    id: "1",
    name: "Sai Ramya",
    line: "Kphb colony, road no 3, phase 1, near shivalaya temple",
  },
  {
    id: "2",
    name: "Sai Ramya",
    line: "Brundhavan gardens 3/2rd line, Maduri girls hostel",
  },
];

/** Same default preview line as `home.tsx` header pill. */
const INITIAL_DISPLAY_LINE =
  "Kphb colony ,road no 3 ,phase 1,near shi...";
const DEFAULT_COUNTRY_ID = 1;
const INDIA_COUNTRY_NAME = "India";

function normalizePincodeValue(value: string): string {
  return value.replace(/\D/g, "");
}

function mapApiToSavedDelivery(a: ApiAddress): SavedDeliveryAddress {
  const street = [a.addressLine1, a.addressLine2].filter(Boolean).join(", ");
  const tail = [a.city, a.state, a.pincode].filter(Boolean).join(", ");
  const line = tail ? `${street} · ${tail}` : street || tail;
  return {
    id: String(a.id),
    name: a.name.trim(),
    line,
    phone: String(a.phone).trim(),
    email: a.email.trim(),
    isDefault: Boolean(a.isDefault),
    addressLine1: (a.addressLine1 || "").trim(),
    addressLine2: (a.addressLine2 || "").trim(),
    city: (a.city || "").trim(),
    state: (a.state || "").trim(),
    pincode: String(a.pincode || "").trim(),
    country: (a.country || "").trim(),
    addressType: (a.addressType || "home").trim(),
  };
}

function addressTypeLabel(t: string | undefined): string {
  const k = (t || "home").toLowerCase();
  if (k === "work") return "Work";
  if (k === "other") return "Other";
  return "Home";
}

export type DeliveryLocationSectionProps = {
  /**
   * When true, list + save + delete use `/api/addresses` via `services/api.tsx`
   * (same pattern as `app/account.tsx`); no host in this file.
   */
  enableFullAddressApi?: boolean;
  /** Optional city API filter: `/api/location/cities?stateId=...` */
  cityFilterStateId?: number;
};

/**
 * Delivery location row + full-screen sheet — search saved, use current location,
 * add new. With `enableFullAddressApi`, addresses load/save through the shared API client.
 */
export default function DeliveryLocationSection({
  enableFullAddressApi = false,
  cityFilterStateId,
}: DeliveryLocationSectionProps) {
  const insets = useSafeAreaInsets();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [deliveryAddressModalVisible, setDeliveryAddressModalVisible] =
    useState(false);
  const [deliveryAddressSearchQuery, setDeliveryAddressSearchQuery] =
    useState("");
  const [displayDeliveryLine, setDisplayDeliveryLine] = useState(
    enableFullAddressApi ? "Tap to choose delivery address" : INITIAL_DISPLAY_LINE
  );
  const [savedDeliveryAddresses, setSavedDeliveryAddresses] = useState<
    SavedDeliveryAddress[]
  >(enableFullAddressApi ? [] : DEFAULT_SAVED_DELIVERY_ADDRESSES);
  const [selectedDeliveryAddressId, setSelectedDeliveryAddressId] = useState<
    string | null
  >(enableFullAddressApi ? null : "1");
  const [deliveryAddMode, setDeliveryAddMode] = useState<"list" | "add">(
    "list"
  );
  const [newAddressName, setNewAddressName] = useState("");
  const [newAddressEmail, setNewAddressEmail] = useState("");
  const [newAddressPhone, setNewAddressPhone] = useState("");
  const [newAddressArea, setNewAddressArea] = useState("");
  const [newAddressCity, setNewAddressCity] = useState("");
  const [newAddressState, setNewAddressState] = useState("");
  const [newAddressPincode, setNewAddressPincode] = useState("");
  const [newAddressUsername, setNewAddressUsername] = useState("");
  const [newAddressLandmark, setNewAddressLandmark] = useState("");
  const [newAddressCountry, setNewAddressCountry] = useState(INDIA_COUNTRY_NAME);
  const [newAddressType, setNewAddressType] = useState<AddressType>("home");
  const [newAddressIsDefault, setNewAddressIsDefault] = useState(false);
  const [cityOptions, setCityOptions] = useState<string[]>([]);
  const [stateOptions, setStateOptions] = useState<string[]>([]);
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [pincodeOptions, setPincodeOptions] = useState<string[]>([]);
  const [citiesLoading, setCitiesLoading] = useState(false);
  const [statesLoading, setStatesLoading] = useState(false);
  const [countriesLoading, setCountriesLoading] = useState(false);
  const [pincodesLoading, setPincodesLoading] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const [showStateSuggestions, setShowStateSuggestions] = useState(false);
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const [showPincodeSuggestions, setShowPincodeSuggestions] = useState(false);
  const [stateRows, setStateRows] = useState<ApiStateRow[]>([]);
  const [countryRows, setCountryRows] = useState<ApiCountryRow[]>([]);
  const [addressesListLoading, setAddressesListLoading] = useState(false);
  const citySuggestionTapInProgressRef = useRef(false);
  const stateSuggestionTapInProgressRef = useRef(false);
  const countrySuggestionTapInProgressRef = useRef(false);
  const pincodeSuggestionTapInProgressRef = useRef(false);
  const addFormScrollInProgressRef = useRef(false);
  const prevCountrySelectionRef = useRef<string>("");
  const prevStateSelectionRef = useRef<string>("");
  const latestCityValueRef = useRef("");
  const latestStateValueRef = useRef("");
  const selectedDeliveryAddressIdRef = useRef<string | null>(null);
  useEffect(() => {
    selectedDeliveryAddressIdRef.current = selectedDeliveryAddressId;
  }, [selectedDeliveryAddressId]);
  useEffect(() => {
    latestCityValueRef.current = newAddressCity;
  }, [newAddressCity]);
  useEffect(() => {
    latestStateValueRef.current = newAddressState;
  }, [newAddressState]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [savedSelectedId, savedSelectedLine] = await Promise.all([
          AsyncStorage.getItem(DELIVERY_SELECTED_ADDRESS_ID_STORAGE_KEY),
          AsyncStorage.getItem(DELIVERY_SELECTED_ADDRESS_LINE_STORAGE_KEY),
        ]);
        if (cancelled) return;
        if (savedSelectedId) {
          setSelectedDeliveryAddressId(savedSelectedId);
        }
        if (savedSelectedLine) {
          setDisplayDeliveryLine(savedSelectedLine);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        if (selectedDeliveryAddressId) {
          await AsyncStorage.setItem(
            DELIVERY_SELECTED_ADDRESS_ID_STORAGE_KEY,
            selectedDeliveryAddressId
          );
        } else {
          await AsyncStorage.removeItem(DELIVERY_SELECTED_ADDRESS_ID_STORAGE_KEY);
        }
      } catch {
        // ignore
      }
    })();
  }, [selectedDeliveryAddressId]);

  useEffect(() => {
    void (async () => {
      try {
        const line = displayDeliveryLine.trim();
        if (line) {
          await AsyncStorage.setItem(
            DELIVERY_SELECTED_ADDRESS_LINE_STORAGE_KEY,
            line
          );
        } else {
          await AsyncStorage.removeItem(DELIVERY_SELECTED_ADDRESS_LINE_STORAGE_KEY);
        }
      } catch {
        // ignore
      }
    })();
  }, [displayDeliveryLine]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await AsyncStorage.getItem("token");
        if (cancelled) return;
        setIsLoggedIn(!!token);
        // For new users (no token), show a direct "Use current location" CTA by default.
        if (!token && displayDeliveryLine === INITIAL_DISPLAY_LINE) {
          setDisplayDeliveryLine("Use current location");
          setSelectedDeliveryAddressId(null);
        }
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (enableFullAddressApi) return;
    let cancelled = false;
    void (async () => {
      try {
        const raw = await AsyncStorage.getItem(DELIVERY_ADDRESSES_STORAGE_KEY);
        if (cancelled || !raw) return;
        const parsed = JSON.parse(raw) as SavedDeliveryAddress[];
        if (!Array.isArray(parsed)) return;
        const valid =
          parsed.length === 0 ||
          parsed.every(
            (a) =>
              a &&
              typeof a.id === "string" &&
              typeof a.name === "string" &&
              typeof a.line === "string"
          );
        if (!valid) return;

        setSavedDeliveryAddresses(parsed);
        if (parsed.length === 0) {
          setSelectedDeliveryAddressId(null);
          setDisplayDeliveryLine("Use current location");
        } else {
          const prevSel = selectedDeliveryAddressIdRef.current;
          const nextSel =
            (prevSel && parsed.some((a) => a.id === prevSel) ? prevSel : null) ||
            parsed[0].id;
          setSelectedDeliveryAddressId(nextSel);
          const row = parsed.find((a) => a.id === nextSel);
          if (row) {
            setDisplayDeliveryLine(row.line);
          }
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enableFullAddressApi]);

  useEffect(() => {
    if (!enableFullAddressApi || !isLoggedIn) return;
    let cancelled = false;
    void (async () => {
      try {
        const rows = await fetchAddresses();
        if (cancelled) return;
        const mapped = rows.map(mapApiToSavedDelivery);
        setSavedDeliveryAddresses(mapped);
        const prevSel = selectedDeliveryAddressIdRef.current;
        let nextSel = prevSel;
        if (!nextSel || !mapped.some((m) => m.id === nextSel)) {
          nextSel = mapped.find((m) => m.isDefault)?.id ?? mapped[0]?.id ?? null;
        }
        setSelectedDeliveryAddressId(nextSel);
        if (nextSel) {
          const row = mapped.find((m) => m.id === nextSel);
          if (row) setDisplayDeliveryLine(row.line);
        } else {
          setDisplayDeliveryLine("Tap to choose delivery address");
        }
      } catch {
        // ignore initial sync failures; modal fetch still works
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enableFullAddressApi, isLoggedIn]);

  useEffect(() => {
    if (!enableFullAddressApi || !deliveryAddressModalVisible) return;
    let cancelled = false;
    void (async () => {
      setAddressesListLoading(true);
      try {
        const rows = await fetchAddresses();
        if (cancelled) return;
        const mapped = rows.map(mapApiToSavedDelivery);
        setSavedDeliveryAddresses(mapped);
        const prevSel = selectedDeliveryAddressIdRef.current;
        let nextSel = prevSel;
        if (!nextSel || !mapped.some((m) => m.id === nextSel)) {
          nextSel =
            mapped.find((m) => m.isDefault)?.id ?? mapped[0]?.id ?? null;
        }
        setSelectedDeliveryAddressId(nextSel);
        if (nextSel) {
          const row = mapped.find((m) => m.id === nextSel);
          if (row) setDisplayDeliveryLine(row.line);
        } else {
          setDisplayDeliveryLine("Tap to choose delivery address");
        }
      } catch {
        if (!cancelled) {
          Alert.alert(
            "Addresses",
            "Could not load saved addresses. Check your connection and login."
          );
        }
      } finally {
        if (!cancelled) setAddressesListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [deliveryAddressModalVisible, enableFullAddressApi]);

  useEffect(() => {
    if (!enableFullAddressApi || deliveryAddMode !== "add") return;
    if (countryOptions.length > 0 || countriesLoading) return;
    let cancelled = false;
    void (async () => {
      setCountriesLoading(true);
      setStatesLoading(true);
      setCitiesLoading(true);
      setPincodesLoading(true);
      try {
        const countries = await fetchCountries({ status: true }).catch(
          () => [] as ApiCountryRow[]
        );
        const selectedCountryName =
          (newAddressCountry || INDIA_COUNTRY_NAME).trim().toLowerCase();
        const matchedCountry =
          countries.find(
            (c) => c.countryName.trim().toLowerCase() === selectedCountryName
          ) || countries.find((c) => c.id === DEFAULT_COUNTRY_ID);
        const activeCountryId = matchedCountry?.id ?? DEFAULT_COUNTRY_ID;

        const states = await fetchStates({
          countryId: activeCountryId,
          status: true,
        }).catch(() => [] as ApiStateRow[]);
        const pickedStateId =
          typeof cityFilterStateId === "number" && Number.isFinite(cityFilterStateId)
            ? cityFilterStateId
            : undefined;
        const cities = await fetchCities({
          stateId: pickedStateId,
          countryId: activeCountryId,
        }).catch(() => []);
        const pincodes = await fetchPincodes({
          countryId: activeCountryId,
          stateId: pickedStateId,
        }).catch(() => []);
        if (cancelled) return;
        const fallbackCountries: ApiCountryRow[] = Array.from(
          new Set(cities.map((c) => c.countryId))
        ).map((countryId) => ({
          id: countryId,
          countryName:
            countryId === DEFAULT_COUNTRY_ID
              ? INDIA_COUNTRY_NAME
              : `Country ${countryId}`,
          status: true,
        }));
        const resolvedCountries =
          countries.length > 0 ? countries : fallbackCountries;
        const resolvedStates = states;
        setCountryRows(resolvedCountries);
        setStateRows(resolvedStates);
        const countryNames = toUniqueCountryNames(resolvedCountries);
        setCountryOptions(
          countryNames.length > 0 ? countryNames : [INDIA_COUNTRY_NAME]
        );
        setStateOptions(toUniqueStateNames(resolvedStates));
        setCityOptions(toUniqueCityNames(cities));
        setPincodeOptions(toUniquePincodes(pincodes));
      } catch {
        // Keep the form usable even if city lookup fails.
        if (!cancelled) {
          setCountryRows([
            { id: DEFAULT_COUNTRY_ID, countryName: INDIA_COUNTRY_NAME, status: true },
          ]);
          setCountryOptions([INDIA_COUNTRY_NAME]);
          setPincodeOptions([]);
        }
      } finally {
        if (!cancelled) {
          setCountriesLoading(false);
          setStatesLoading(false);
          setCitiesLoading(false);
          setPincodesLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    enableFullAddressApi,
    deliveryAddMode,
    countryOptions.length,
    countriesLoading,
    citiesLoading,
    cityFilterStateId,
    newAddressCountry,
  ]);

  // Ensure city dropdown is always populated from `/api/location/cities`.
  useEffect(() => {
    if (!enableFullAddressApi || deliveryAddMode !== "add") return;
    let cancelled = false;
    void (async () => {
      setCitiesLoading(true);
      try {
        const cities = await fetchCities({ countryId: DEFAULT_COUNTRY_ID });
        if (cancelled) return;
        setCityOptions(toUniqueCityNames(cities));
      } catch {
        // keep form usable
      } finally {
        if (!cancelled) setCitiesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enableFullAddressApi, deliveryAddMode]);

  // Ensure state dropdown is populated from `/api/location/states`.
  useEffect(() => {
    if (!enableFullAddressApi || deliveryAddMode !== "add") return;
    let cancelled = false;
    void (async () => {
      setStatesLoading(true);
      try {
        const states = await fetchStates({
          countryId: DEFAULT_COUNTRY_ID,
          status: true,
        });
        if (cancelled) return;
        setStateRows(states);
        setStateOptions(toUniqueStateNames(states));
      } catch {
        // Keep current options on failure.
      } finally {
        if (!cancelled) setStatesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enableFullAddressApi, deliveryAddMode]);

  useEffect(() => {
    if (!enableFullAddressApi || deliveryAddMode !== "add") return;
    const selectedCountryName = newAddressCountry.trim().toLowerCase();
    const selectedCountry =
      countryRows.find(
        (c) => c.countryName.trim().toLowerCase() === selectedCountryName
      ) || countryRows.find((c) => c.id === DEFAULT_COUNTRY_ID);
    if (!selectedCountry) return;

    let cancelled = false;
    void (async () => {
      const previousCountrySelection = prevCountrySelectionRef.current;
      const countryChanged =
        previousCountrySelection.length > 0 &&
        previousCountrySelection !== selectedCountryName;
      setStatesLoading(true);
      setCitiesLoading(true);
      setPincodesLoading(true);
      try {
        const [states, cities, pincodes] = await Promise.all([
          fetchStates({
            countryId: selectedCountry.id,
            status: true,
          }).catch(() => []),
          fetchCities({
            countryId: selectedCountry.id,
          }).catch(() => []),
          fetchPincodes({
            countryId: selectedCountry.id,
          }).catch(() => []),
        ]);
        if (cancelled) return;
        const resolvedStates = states;
        setStateRows(resolvedStates);
        setStateOptions(toUniqueStateNames(resolvedStates));
        // Keep cities available by default; state selection narrows them later.
        setCityOptions(toUniqueCityNames(cities));
        setPincodeOptions(toUniquePincodes(pincodes));
        if (countryChanged) {
          setNewAddressState("");
          setNewAddressCity("");
          setNewAddressPincode("");
        }
        prevCountrySelectionRef.current = selectedCountryName;
      } catch {
        // keep form usable
      } finally {
        if (!cancelled) {
          setStatesLoading(false);
          setCitiesLoading(false);
          setPincodesLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enableFullAddressApi, deliveryAddMode, newAddressCountry, countryRows]);

  useEffect(() => {
    if (!enableFullAddressApi || deliveryAddMode !== "add") return;
    const normalizedState = newAddressState.trim().toLowerCase();
    const selectedState = stateRows.find(
      (s) => s.stateName.trim().toLowerCase() === normalizedState
    );
    if (!selectedState) return;
    const selectedCountryName = newAddressCountry.trim().toLowerCase();
    const selectedCountry =
      countryRows.find(
        (c) => c.countryName.trim().toLowerCase() === selectedCountryName
      ) || countryRows.find((c) => c.id === DEFAULT_COUNTRY_ID);
    if (!selectedCountry) return;

    let cancelled = false;
    void (async () => {
      const previousStateSelection = prevStateSelectionRef.current;
      const stateChanged =
        previousStateSelection.length > 0 &&
        previousStateSelection !== normalizedState;
      setCitiesLoading(true);
      setPincodesLoading(true);
      try {
        const [cities, pincodes] = await Promise.all([
          fetchCities({
            countryId: selectedCountry.id,
            stateId: selectedState.id,
          }),
          fetchPincodes({
            countryId: selectedCountry.id,
            stateId: selectedState.id,
          }),
        ]);
        if (cancelled) return;
        setCityOptions(toUniqueCityNames(cities));
        setPincodeOptions(toUniquePincodes(pincodes));
        if (stateChanged) {
          setNewAddressCity("");
          setNewAddressPincode("");
        }
        prevStateSelectionRef.current = normalizedState;
      } catch {
        // keep form usable
      } finally {
        if (!cancelled) {
          setCitiesLoading(false);
          setPincodesLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    enableFullAddressApi,
    deliveryAddMode,
    newAddressCountry,
    newAddressState,
    stateRows,
    countryRows,
  ]);

  useEffect(() => {
    if (!enableFullAddressApi || deliveryAddMode !== "add") return;
    const normalizedCity = newAddressCity.trim().toLowerCase();
    if (!normalizedCity) return;
    const selectedCity = cityOptions.find(
      (city) => city.trim().toLowerCase() === normalizedCity
    );
    if (!selectedCity) return;

    const selectedCountryName = newAddressCountry.trim().toLowerCase();
    const selectedCountry =
      countryRows.find(
        (c) => c.countryName.trim().toLowerCase() === selectedCountryName
      ) || countryRows.find((c) => c.id === DEFAULT_COUNTRY_ID);
    if (!selectedCountry) return;

    const normalizedState = newAddressState.trim().toLowerCase();
    const selectedState = stateRows.find(
      (s) => s.stateName.trim().toLowerCase() === normalizedState
    );
    if (!selectedState) return;

    let cancelled = false;
    void (async () => {
      setPincodesLoading(true);
      try {
        const cityRows = await fetchCities({
          countryId: selectedCountry.id,
          stateId: selectedState.id,
        });
        const selectedCityRow = cityRows.find(
          (row) => row.cityName.trim().toLowerCase() === normalizedCity
        );
        if (!selectedCityRow) return;
        const pincodeAttempts = [
          {
            countryId: selectedCountry.id,
            stateId: selectedState.id,
            cityId: selectedCityRow.id,
          },
          {
            countryId: selectedCountry.id,
            stateId: selectedState.id,
          },
          {
            countryId: selectedCountry.id,
          },
          {},
        ];
        let nextPincodes: string[] = [];
        for (const params of pincodeAttempts) {
          const rows = await fetchPincodes(params);
          const uniquePincodes = toUniquePincodes(rows);
          if (uniquePincodes.length > 0) {
            nextPincodes = uniquePincodes;
            break;
          }
        }
        if (cancelled) return;
        setPincodeOptions(nextPincodes);
      } catch {
        // keep form usable
      } finally {
        if (!cancelled) setPincodesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    enableFullAddressApi,
    deliveryAddMode,
    newAddressCountry,
    newAddressState,
    newAddressCity,
    cityOptions,
    stateRows,
    countryRows,
  ]);

  useEffect(() => {
    if (!enableFullAddressApi || deliveryAddMode !== "add") return;
    if (!showPincodeSuggestions || pincodeOptions.length > 0) return;

    const selectedCountryName = newAddressCountry.trim().toLowerCase();
    const selectedCountry =
      countryRows.find(
        (c) => c.countryName.trim().toLowerCase() === selectedCountryName
      ) || countryRows.find((c) => c.id === DEFAULT_COUNTRY_ID);
    if (!selectedCountry) return;

    let cancelled = false;
    void (async () => {
      setPincodesLoading(true);
      try {
        const normalizedState = newAddressState.trim().toLowerCase();
        const selectedState = stateRows.find(
          (s) => s.stateName.trim().toLowerCase() === normalizedState
        );

        let cityId: number | undefined;
        const normalizedCity = newAddressCity.trim().toLowerCase();
        if (selectedState && normalizedCity) {
          const cityRows = await fetchCities({
            countryId: selectedCountry.id,
            stateId: selectedState.id,
          });
          const selectedCityRow = cityRows.find(
            (row) => row.cityName.trim().toLowerCase() === normalizedCity
          );
          cityId = selectedCityRow?.id;
        }

        const pincodeAttempts = [
          {
            countryId: selectedCountry.id,
            stateId: selectedState?.id,
            cityId,
          },
          {
            countryId: selectedCountry.id,
            stateId: selectedState?.id,
          },
          {
            countryId: selectedCountry.id,
          },
          {},
        ];
        let nextPincodes: string[] = [];
        for (const params of pincodeAttempts) {
          const rows = await fetchPincodes(params);
          const uniquePincodes = toUniquePincodes(rows);
          if (uniquePincodes.length > 0) {
            nextPincodes = uniquePincodes;
            break;
          }
        }
        if (cancelled) return;
        setPincodeOptions(nextPincodes);
      } catch {
        // keep form usable
      } finally {
        if (!cancelled) setPincodesLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    enableFullAddressApi,
    deliveryAddMode,
    showPincodeSuggestions,
    pincodeOptions.length,
    newAddressCountry,
    newAddressState,
    newAddressCity,
    countryRows,
    stateRows,
  ]);

  const persistSavedDeliveryAddresses = useCallback(
    async (next: SavedDeliveryAddress[]) => {
      setSavedDeliveryAddresses(next);
      if (enableFullAddressApi) return;
      try {
        await AsyncStorage.setItem(
          DELIVERY_ADDRESSES_STORAGE_KEY,
          JSON.stringify(next)
        );
      } catch {
        /* ignore */
      }
    },
    [enableFullAddressApi]
  );

  const resetAddAddressFields = useCallback(() => {
    setNewAddressName("");
    setNewAddressEmail("");
    setNewAddressPhone("");
    setNewAddressArea("");
    setNewAddressCity("");
    setNewAddressState("");
    setNewAddressPincode("");
    setNewAddressUsername("");
    setNewAddressLandmark("");
    setNewAddressCountry(INDIA_COUNTRY_NAME);
    setNewAddressType("home");
    setNewAddressIsDefault(false);
  }, []);

  const closeDeliveryModal = useCallback(() => {
    setDeliveryAddressModalVisible(false);
    setDeliveryAddressSearchQuery("");
    setDeliveryAddMode("list");
    setShowCountrySuggestions(false);
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
    setShowPincodeSuggestions(false);
    resetAddAddressFields();
  }, [resetAddAddressFields]);

  const openAddNewAddressForm = useCallback(() => {
    resetAddAddressFields();
    setDeliveryAddMode("add");
    setShowCountrySuggestions(false);
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
    setShowPincodeSuggestions(false);
  }, [resetAddAddressFields]);

  const goBackAddAddressForm = useCallback(() => {
    setDeliveryAddMode("list");
    setShowCountrySuggestions(false);
    setShowStateSuggestions(false);
    setShowCitySuggestions(false);
    setShowPincodeSuggestions(false);
    resetAddAddressFields();
  }, [resetAddAddressFields]);

  const filteredDeliveryAddresses = useMemo(() => {
    const q = deliveryAddressSearchQuery.trim().toLowerCase();
    if (!q) return savedDeliveryAddresses;
    return savedDeliveryAddresses.filter((a) => {
      const hay = [
        a.name,
        a.line,
        a.phone,
        a.email,
        a.addressLine1,
        a.addressLine2,
        a.city,
        a.state,
        a.pincode,
        a.country,
        a.addressType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [savedDeliveryAddresses, deliveryAddressSearchQuery]);

  const filteredCitySuggestions = useMemo(() => {
    if (!showCitySuggestions) return [];
    if (cityOptions.length === 0) return [];
    const q = newAddressCity.trim().toLowerCase();
    if (!q) return cityOptions.slice(0, 20);
    return cityOptions
      .filter((name) => name.toLowerCase().includes(q))
      .slice(0, 20);
  }, [showCitySuggestions, cityOptions, newAddressCity]);

  const filteredStateSuggestions = useMemo(() => {
    if (!showStateSuggestions || stateOptions.length === 0) return [];
    const q = newAddressState.trim().toLowerCase();
    if (!q) return stateOptions.slice(0, 8);
    return stateOptions
      .filter((name) => name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [showStateSuggestions, stateOptions, newAddressState]);

  const filteredCountrySuggestions = useMemo(() => {
    if (!showCountrySuggestions || countryOptions.length === 0) return [];
    const q = newAddressCountry.trim().toLowerCase();
    if (!q) return countryOptions.slice(0, 8);
    return countryOptions
      .filter((name) => name.toLowerCase().includes(q))
      .slice(0, 8);
  }, [showCountrySuggestions, countryOptions, newAddressCountry]);

  const filteredPincodeSuggestions = useMemo(() => {
    if (!showPincodeSuggestions || pincodeOptions.length === 0) return [];
    const q = newAddressPincode.trim().toLowerCase();
    if (!q) return pincodeOptions.slice(0, 12);
    return pincodeOptions.filter((code) => code.toLowerCase().includes(q)).slice(0, 12);
  }, [showPincodeSuggestions, pincodeOptions, newAddressPincode]);

  const cityFoundFromApi = useMemo(() => {
    const city = newAddressCity.trim().toLowerCase();
    if (!city || cityOptions.length === 0) return null;
    return cityOptions.some((name) => name.trim().toLowerCase() === city);
  }, [newAddressCity, cityOptions]);

  const pincodeFoundFromApi = useMemo(() => {
    const code = normalizePincodeValue(newAddressPincode.trim());
    if (!code || pincodeOptions.length === 0) return null;
    return pincodeOptions.some((p) => normalizePincodeValue(p) === code);
  }, [newAddressPincode, pincodeOptions]);

  const applyCitySuggestion = useCallback((city: string) => {
    citySuggestionTapInProgressRef.current = true;
    Keyboard.dismiss();
    setNewAddressCity(city);
    setShowCitySuggestions(false);
  }, []);

  const applyStateSuggestion = useCallback((state: string) => {
    stateSuggestionTapInProgressRef.current = true;
    Keyboard.dismiss();
    prevStateSelectionRef.current = state.trim().toLowerCase();
    setNewAddressState(state);
    setNewAddressCity("");
    setNewAddressPincode("");
    setShowStateSuggestions(false);
  }, []);

  const applyPincodeSuggestion = useCallback((pincode: string) => {
    pincodeSuggestionTapInProgressRef.current = true;
    Keyboard.dismiss();
    setNewAddressPincode(pincode);
    setShowPincodeSuggestions(false);
  }, []);

  const applyCountrySuggestion = useCallback((country: string) => {
    countrySuggestionTapInProgressRef.current = true;
    Keyboard.dismiss();
    prevCountrySelectionRef.current = country.trim().toLowerCase();
    setNewAddressCountry(country);
    setNewAddressState("");
    setNewAddressCity("");
    setNewAddressPincode("");
    setShowCountrySuggestions(false);
  }, []);

  const resolveFullNameFromOptions = useCallback(
    (input: string, options: string[]): string => {
      const normalizedInput = input.trim().toLowerCase();
      if (!normalizedInput) return "";
      const exact = options.find(
        (name) => name.trim().toLowerCase() === normalizedInput
      );
      if (exact) return exact;
      const startsWith = options.filter((name) =>
        name.trim().toLowerCase().startsWith(normalizedInput)
      );
      if (startsWith.length === 1) return startsWith[0];
      return input.trim();
    },
    []
  );

  const selectDeliveryAddress = useCallback(
    (addr: SavedDeliveryAddress) => {
      setSelectedDeliveryAddressId(addr.id);
      setDisplayDeliveryLine(addr.line);
      closeDeliveryModal();
    },
    [closeDeliveryModal]
  );

  const handleUseCurrentLocation = useCallback(async () => {
    const result: RequestForegroundLocationResult =
      await requestForegroundLocation();
    if (result.ok) {
      setDisplayDeliveryLine(result.addressLine);
      closeDeliveryModal();
      return;
    }

    // `ok: false` path (new user / denied / errors)
    const err = result as any;
    if (err.reason === "denied") {
      Alert.alert(
        "Location",
        "Location permission is required to use your current address."
      );
      return;
    }
    if (err.reason === "error") {
      Alert.alert("Location", err.message ?? "Unable to fetch your location.");
      return;
    }
    if (err.reason === "web") {
      Alert.alert("Location", "Current location is not supported on web.");
      return;
    }
  }, [closeDeliveryModal]);

  const handleSaveNewAddress = useCallback(() => {
    const name = newAddressName.trim();
    const email = newAddressEmail.trim();
    const phone = newAddressPhone.trim().replace(/\D/g, "").slice(0, 10);
    const area = newAddressArea.trim();
    const landmark = newAddressLandmark.trim();
    const city = newAddressCity.trim();
    const state = newAddressState.trim();
    const pincode = normalizePincodeValue(newAddressPincode.trim());
    const username = newAddressUsername.trim();
    const country = (newAddressCountry || INDIA_COUNTRY_NAME).trim();
    const isIndiaCountry = country.toLowerCase() === INDIA_COUNTRY_NAME.toLowerCase();

    if (!name) {
      Alert.alert("Missing details", "Please enter your full name.");
      return;
    }
    if (!email) {
      Alert.alert("Missing details", "Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }
    if (phone.length !== 10) {
      Alert.alert("Invalid mobile", "Enter a valid 10-digit mobile number.");
      return;
    }
    if (!area) {
      Alert.alert("Missing details", "Please enter area / house details.");
      return;
    }
    if (!city || !state) {
      Alert.alert("Missing details", "Please enter city and state.");
      return;
    }
    if (
      enableFullAddressApi &&
      cityOptions.length > 0 &&
      !cityOptions.some((name) => name.trim().toLowerCase() === city.toLowerCase())
    ) {
      Alert.alert("City not found", "Please select a valid city from the dropdown.");
      return;
    }
    if (!/^[0-9]{6}$/.test(pincode)) {
      Alert.alert("Invalid pincode", "Enter a valid 6-digit pincode.");
      return;
    }
    if (
      enableFullAddressApi &&
      pincodeOptions.length > 0 &&
      !pincodeOptions.some((p) => normalizePincodeValue(p) === pincode)
    ) {
      Alert.alert(
        "Pincode not found",
        "Please select a valid pincode from the dropdown."
      );
      return;
    }
    if (enableFullAddressApi && !country) {
      Alert.alert("Missing details", "Please enter country.");
      return;
    }
    if (enableFullAddressApi && !isIndiaCountry) {
      Alert.alert(
        "Only India supported",
        "For now, we accept delivery locations only in India."
      );
      return;
    }

    if (enableFullAddressApi) {
      const payload: CreateAddressPayload = {
        name,
        email,
        phone,
        addressLine1: area,
        addressLine2: landmark,
        city,
        state,
        country: INDIA_COUNTRY_NAME,
        pincode,
        addressType: newAddressType,
        isDefault: newAddressIsDefault,
      };

      void (async () => {
        try {
          const responseBody = await createAddress(payload);
          const rows = await fetchAddresses();
          setSavedDeliveryAddresses(rows.map(mapApiToSavedDelivery));
          const idStr = parseServerAddressId(responseBody);
          const createdApi =
            (idStr && rows.find((r) => String(r.id) === idStr)) ||
            rows[rows.length - 1];
          if (createdApi) {
            selectDeliveryAddress(mapApiToSavedDelivery(createdApi));
          }
          Alert.alert("Success", "Address saved successfully.");
        } catch (e) {
          let msg = "Could not save address. Please try again.";
          if (axios.isAxiosError(e)) {
            const status = e.response?.status;
            const d = e.response?.data as
              | { message?: string; error?: string }
              | undefined;
            const serverMsg =
              (typeof d?.message === "string" && d.message) ||
              (typeof d?.error === "string" && d.error);
            if (status === 401 || status === 403) {
              msg =
                serverMsg ||
                "Log in so your session token is sent with this request.";
            } else {
              msg = serverMsg || e.message || msg;
            }
          } else if (e instanceof Error) {
            msg = e.message;
          }
          Alert.alert("Save failed", String(msg));
        }
      })();
      return;
    }

    const areaForLine = landmark ? `${area}, ${landmark}` : area;
    const line = `${areaForLine}, ${city}, ${state} - ${pincode}`;

    const newAddr: SavedDeliveryAddress = {
      id: `addr-${Date.now()}`,
      name,
      line,
      phone,
      email,
      ...(username ? { username } : {}),
    };
    void (async () => {
      const next = [...savedDeliveryAddresses, newAddr];
      await persistSavedDeliveryAddresses(next);
      setDeliveryAddMode("list");
      resetAddAddressFields();
      selectDeliveryAddress(newAddr);
    })();
  }, [
    enableFullAddressApi,
    newAddressName,
    newAddressEmail,
    newAddressPhone,
    newAddressArea,
    newAddressLandmark,
    newAddressCity,
    newAddressState,
    newAddressPincode,
    newAddressCountry,
    newAddressType,
    newAddressIsDefault,
    newAddressUsername,
    savedDeliveryAddresses,
    persistSavedDeliveryAddresses,
    resetAddAddressFields,
    selectDeliveryAddress,
  ]);

  const handleDeleteSavedAddress = useCallback(
    (addr: SavedDeliveryAddress) => {
      Alert.alert("Delete address", `Delete "${addr.name}" address?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            void (async () => {
              if (enableFullAddressApi) {
                try {
                  await deleteAddress(addr.id);
                  const rows = await fetchAddresses();
                  const mapped = rows.map(mapApiToSavedDelivery);
                  setSavedDeliveryAddresses(mapped);
                  if (selectedDeliveryAddressId === addr.id) {
                    if (mapped.length > 0) {
                      setSelectedDeliveryAddressId(mapped[0].id);
                      setDisplayDeliveryLine(mapped[0].line);
                    } else {
                      setSelectedDeliveryAddressId(null);
                      setDisplayDeliveryLine("Tap to choose delivery address");
                    }
                  }
                } catch (e) {
                  let msg = "Could not delete address.";
                  if (axios.isAxiosError(e)) {
                    const d = e.response?.data as
                      | { message?: string; error?: string }
                      | undefined;
                    msg =
                      (typeof d?.message === "string" && d.message) ||
                      (typeof d?.error === "string" && d.error) ||
                      msg;
                  } else if (e instanceof Error) {
                    msg = e.message;
                  }
                  Alert.alert("Delete failed", String(msg));
                }
                return;
              }

              const next = savedDeliveryAddresses.filter((x) => x.id !== addr.id);
              await persistSavedDeliveryAddresses(next);
              if (selectedDeliveryAddressId === addr.id) {
                if (next.length > 0) {
                  setSelectedDeliveryAddressId(next[0].id);
                  setDisplayDeliveryLine(next[0].line);
                } else {
                  setSelectedDeliveryAddressId(null);
                  setDisplayDeliveryLine("Use current location");
                }
              }
            })();
          },
        },
      ]);
    },
    [
      enableFullAddressApi,
      persistSavedDeliveryAddresses,
      savedDeliveryAddresses,
      selectedDeliveryAddressId,
    ]
  );

  const handleSetDefaultSavedAddress = useCallback(
    (addr: SavedDeliveryAddress) => {
      if (!enableFullAddressApi || addr.isDefault) return;
      void (async () => {
        try {
          const res = await setDefaultAddress(addr.id);
          const rows = await fetchAddresses();
          const mapped = rows.map(mapApiToSavedDelivery);
          setSavedDeliveryAddresses(mapped);
          const msg =
            typeof res?.message === "string" && res.message.trim()
              ? res.message.trim()
              : "Default address updated.";
          Alert.alert("Success", msg);
        } catch (e) {
          let msg = "Could not set default address. Please try again.";
          if (axios.isAxiosError(e)) {
            const status = e.response?.status;
            const d = e.response?.data as
              | { message?: string; error?: string }
              | undefined;
            const serverMsg =
              (typeof d?.message === "string" && d.message) ||
              (typeof d?.error === "string" && d.error);
            if (status === 401 || status === 403) {
              msg =
                serverMsg ||
                "Log in so your session token is sent with this request.";
            } else {
              msg = serverMsg || e.message || msg;
            }
          } else if (e instanceof Error) {
            msg = e.message;
          }
          Alert.alert("Set default failed", String(msg));
        }
      })();
    },
    [enableFullAddressApi]
  );

  return (
    <>
      <TouchableOpacity
        style={styles.locationPillOuter}
        onPress={() => {
          if (!isLoggedIn && displayDeliveryLine === "Use current location") {
            void handleUseCurrentLocation();
            return;
          }
          setDeliveryAddressModalVisible(true);
        }}
        activeOpacity={0.85}
        accessibilityRole="button"
        accessibilityLabel="Delivery address, tap to change"
      >
        <View style={styles.locationPill}>
          <MaterialIcons name="place" size={17} color="#0F172A" />
          <Text
            style={styles.locationPillText}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {displayDeliveryLine}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#0F172A" />
        </View>
      </TouchableOpacity>

      <Modal
        visible={deliveryAddressModalVisible}
        transparent={false}
        animationType="slide"
        presentationStyle={
          Platform.OS === "ios" ? "fullScreen" : undefined
        }
        onRequestClose={closeDeliveryModal}
      >
        <View
          style={[
            styles.deliveryModalRootFull,
            {
              paddingTop: insets.top,
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}
        >
          {deliveryAddMode === "list" ? (
            <View style={styles.deliverySheetPage}>
              <View style={styles.deliverySheetHeader}>
                <Text style={styles.deliverySheetTitle}>
                  Select delivery address
                </Text>
                <TouchableOpacity
                  onPress={closeDeliveryModal}
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                >
                  <Ionicons name="close" size={26} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.deliverySheetBodyScroll}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.deliverySheetScroll}
              >
                  {enableFullAddressApi && addressesListLoading ? (
                    <View style={styles.deliveryListLoading}>
                      <ActivityIndicator size="small" color="#F97316" />
                      <Text style={styles.deliveryListLoadingText}>
                        Loading addresses…
                      </Text>
                    </View>
                  ) : null}
                  <View style={styles.deliverySearchBox}>
                    <Ionicons name="search-outline" size={20} color="#999" />
                    <TextInput
                      placeholder="Search by area, street name, pin code"
                      placeholderTextColor="#999"
                      style={styles.deliverySearchInput}
                      value={deliveryAddressSearchQuery}
                      onChangeText={setDeliveryAddressSearchQuery}
                    />
                  </View>

                  <TouchableOpacity
                    style={styles.deliveryUseCurrentRow}
                    activeOpacity={0.75}
                    onPress={() => void handleUseCurrentLocation()}
                    accessibilityRole="button"
                    accessibilityLabel="Use my current location"
                  >
                    <View style={styles.deliveryUseCurrentIconWrap}>
                      <Ionicons name="locate" size={22} color="#1976D2" />
                    </View>
                    <View style={styles.deliveryUseCurrentTextCol}>
                      <Text style={styles.deliveryUseCurrentTitle}>
                        Use my current location
                      </Text>
                      <Text style={styles.deliveryUseCurrentSub}>
                        Allow access to location
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.deliveryDividerDashed} />

                  <View style={styles.deliverySavedHeaderRow}>
                    <Text style={styles.deliverySavedTitle}>Saved addresses</Text>
                    <TouchableOpacity
                      onPress={openAddNewAddressForm}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Text style={styles.deliveryAddNewText}>+ Add New</Text>
                    </TouchableOpacity>
                  </View>

                  {filteredDeliveryAddresses.map((addr) => {
                    const selected = addr.id === selectedDeliveryAddressId;
                    if (enableFullAddressApi) {
                      return (
                        <View
                          key={addr.id}
                          style={styles.deliveryAddressCard}
                        >
                          <TouchableOpacity
                            style={styles.deliveryAddressCardSelectArea}
                            activeOpacity={0.8}
                            onPress={() => selectDeliveryAddress(addr)}
                            accessibilityRole="button"
                            accessibilityLabel={`Select delivery address ${addr.name}`}
                          >
                            <MaterialIcons name="place" size={22} color="#666" />
                            <View style={styles.deliveryAddressCardBody}>
                              <View style={styles.deliveryAddressNameRow}>
                                <Text
                                  style={styles.deliveryAddressTypePill}
                                  numberOfLines={1}
                                >
                                  {addressTypeLabel(addr.addressType)}
                                </Text>
                                {addr.isDefault ? (
                                  <View style={styles.deliveryDefaultBadge}>
                                    <Text style={styles.deliveryDefaultBadgeText}>
                                      Default
                                    </Text>
                                  </View>
                                ) : null}
                                {selected ? (
                                  <View style={styles.deliverySelectedBadge}>
                                    <Text style={styles.deliverySelectedBadgeText}>
                                      For this order
                                    </Text>
                                  </View>
                                ) : null}
                              </View>
                              <Text
                                style={styles.deliveryAddressName}
                                numberOfLines={1}
                              >
                                {addr.name}
                              </Text>
                              {addr.addressLine1 ? (
                                <Text
                                  style={styles.deliveryAddressDetailLine}
                                  numberOfLines={2}
                                >
                                  {addr.addressLine1}
                                </Text>
                              ) : null}
                              {addr.addressLine2 ? (
                                <Text
                                  style={styles.deliveryAddressDetailLine}
                                  numberOfLines={2}
                                >
                                  {addr.addressLine2}
                                </Text>
                              ) : null}
                              {(() => {
                                const cs = [addr.city, addr.state]
                                  .filter(Boolean)
                                  .join(", ");
                                const loc =
                                  cs && addr.pincode
                                    ? `${cs} - ${addr.pincode}`
                                    : cs || addr.pincode;
                                return loc ? (
                                  <Text
                                    style={styles.deliveryAddressDetailMeta}
                                    numberOfLines={2}
                                  >
                                    {loc}
                                  </Text>
                                ) : null;
                              })()}
                              {addr.country ? (
                                <Text
                                  style={styles.deliveryAddressDetailMeta}
                                  numberOfLines={1}
                                >
                                  {addr.country}
                                </Text>
                              ) : null}
                              {addr.phone ? (
                                <Text
                                  style={styles.deliveryAddressPhone}
                                  numberOfLines={1}
                                >
                                  {addr.phone}
                                </Text>
                              ) : null}
                              {addr.email ? (
                                <Text
                                  style={styles.deliveryAddressEmail}
                                  numberOfLines={1}
                                >
                                  {addr.email}
                                </Text>
                              ) : null}
                            </View>
                          </TouchableOpacity>
                          <View style={styles.deliveryAddressActionsCol}>
                            {!addr.isDefault ? (
                              <TouchableOpacity
                                style={styles.deliverySetDefaultBtn}
                                activeOpacity={0.75}
                                onPress={() =>
                                  handleSetDefaultSavedAddress(addr)
                                }
                                accessibilityRole="button"
                                accessibilityLabel="Set as account default address"
                              >
                                <Text style={styles.deliverySetDefaultBtnText}>
                                  Set default
                                </Text>
                              </TouchableOpacity>
                            ) : null}
                            <TouchableOpacity
                              style={styles.deliveryAddressMenuBtn}
                              activeOpacity={0.7}
                              onPress={() => handleDeleteSavedAddress(addr)}
                              accessibilityRole="button"
                              accessibilityLabel="Delete saved address"
                            >
                              <Ionicons
                                name="trash-outline"
                                size={20}
                                color="#666"
                              />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    }
                    return (
                      <TouchableOpacity
                        key={addr.id}
                        style={styles.deliveryAddressCard}
                        activeOpacity={0.8}
                        onPress={() => selectDeliveryAddress(addr)}
                      >
                        <MaterialIcons name="place" size={22} color="#666" />
                        <View style={styles.deliveryAddressCardBody}>
                          <View style={styles.deliveryAddressNameRow}>
                            <Text
                              style={styles.deliveryAddressName}
                              numberOfLines={1}
                            >
                              {addr.name}
                            </Text>
                            {selected ? (
                              <View style={styles.deliverySelectedBadge}>
                                <Text style={styles.deliverySelectedBadgeText}>
                                  Currently selected
                                </Text>
                              </View>
                            ) : null}
                          </View>
                          <Text
                            style={styles.deliveryAddressLine}
                            numberOfLines={2}
                            ellipsizeMode="tail"
                          >
                            {addr.line}
                          </Text>
                          {addr.phone ? (
                            <Text style={styles.deliveryAddressPhone} numberOfLines={1}>
                              {addr.phone}
                            </Text>
                          ) : null}
                        </View>
                        <TouchableOpacity
                          style={styles.deliveryAddressMenuBtn}
                          activeOpacity={0.7}
                          onPress={() => handleDeleteSavedAddress(addr)}
                          accessibilityRole="button"
                          accessibilityLabel="Delete saved address"
                        >
                          <Ionicons name="ellipsis-vertical" size={20} color="#666" />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          ) : (
            <KeyboardAvoidingView
              style={styles.deliveryAddKeyboardRoot}
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={Platform.OS === "ios" ? insets.top + 8 : 0}
            >
              <View style={styles.deliverySheetPage}>
                <View style={styles.deliveryAddHeaderRow}>
                  <TouchableOpacity
                    onPress={goBackAddAddressForm}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                    accessibilityRole="button"
                    accessibilityLabel="Back"
                  >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                  </TouchableOpacity>
                  <Text style={styles.deliveryAddSheetTitle}>Add new address</Text>
                  <TouchableOpacity
                    onPress={closeDeliveryModal}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <Ionicons name="close" size={26} color="#333" />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  style={styles.deliverySheetBodyScroll}
                  keyboardShouldPersistTaps="always"
                  showsVerticalScrollIndicator={false}
                  keyboardDismissMode="none"
                  onScrollBeginDrag={() => {
                    addFormScrollInProgressRef.current = true;
                  }}
                  onScrollEndDrag={() => {
                    addFormScrollInProgressRef.current = false;
                  }}
                  onMomentumScrollEnd={() => {
                    addFormScrollInProgressRef.current = false;
                  }}
                  contentContainerStyle={styles.deliverySheetScrollAdd}
                >
                  <Text style={styles.deliveryFormLabelRef}>
                    Full Name <Text style={styles.deliveryRequiredMark}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.deliveryFormInputRef}
                    placeholder="Enter full name"
                    placeholderTextColor="#9CA3AF"
                    value={newAddressName}
                    onChangeText={setNewAddressName}
                  />

                  <Text style={styles.deliveryFormLabelRef}>
                    Email Address <Text style={styles.deliveryRequiredMark}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.deliveryFormInputRef}
                    placeholder="Enter email address"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={newAddressEmail}
                    onChangeText={setNewAddressEmail}
                  />

                  <Text style={styles.deliveryFormLabelRef}>
                    Mobile Number <Text style={styles.deliveryRequiredMark}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.deliveryFormInputRef}
                    placeholder="10-digit mobile number"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={newAddressPhone}
                    onChangeText={setNewAddressPhone}
                  />

                  <Text style={styles.deliveryFormLabelRef}>
                    Area <Text style={styles.deliveryRequiredMark}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.deliveryFormInputRef}
                    placeholder="H.no/Area Name"
                    placeholderTextColor="#9CA3AF"
                    value={newAddressArea}
                    onChangeText={setNewAddressArea}
                  />

                  <Text style={styles.deliveryFormLabelRef}>
                    Landmark / line 2{" "}
                    <Text style={styles.deliveryFormOptionalRef}>(optional)</Text>
                  </Text>
                  <TextInput
                    style={styles.deliveryFormInputRef}
                    placeholder="e.g. Near temple"
                    placeholderTextColor="#9CA3AF"
                    value={newAddressLandmark}
                    onChangeText={setNewAddressLandmark}
                  />

                  <Text style={styles.deliveryFormLabelRef}>
                    City <Text style={styles.deliveryRequiredMark}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.deliveryFormInputRef}
                    placeholder="Enter city"
                    placeholderTextColor="#9CA3AF"
                    value={newAddressCity}
                    onChangeText={setNewAddressCity}
                    onFocus={() => setShowCitySuggestions(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        if (addFormScrollInProgressRef.current) return;
                        if (citySuggestionTapInProgressRef.current) {
                          citySuggestionTapInProgressRef.current = false;
                          return;
                        }
                        const currentCityValue = latestCityValueRef.current;
                        const resolvedCity = resolveFullNameFromOptions(
                          currentCityValue,
                          cityOptions
                        );
                        if (resolvedCity && resolvedCity !== currentCityValue.trim()) {
                          setNewAddressCity(resolvedCity);
                        }
                        setShowCitySuggestions(false);
                      }, 220);
                    }}
                  />
                  {enableFullAddressApi ? (
                    filteredCitySuggestions.length > 0 ? (
                      <View style={styles.deliveryCitySuggestionBox}>
                        {filteredCitySuggestions.map((city) => (
                          <TouchableOpacity
                            key={city}
                            style={styles.deliveryCitySuggestionItem}
                            activeOpacity={0.75}
                            onPressIn={() => {
                              applyCitySuggestion(city);
                            }}
                            onPress={() => {
                              applyCitySuggestion(city);
                            }}
                          >
                            <Text style={styles.deliveryCitySuggestionText}>
                              {city}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : cityFoundFromApi === false ? (
                      <Text style={styles.deliveryCityHint}>
                        City not found.
                      </Text>
                    ) : cityFoundFromApi === true ? (
                      <Text style={styles.deliveryCityHint}>
                        City found.
                      </Text>
                    ) : null
                  ) : null}

                  <Text style={styles.deliveryFormLabelRef}>
                    State <Text style={styles.deliveryRequiredMark}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.deliveryFormInputRef}
                    placeholder="Enter state"
                    placeholderTextColor="#9CA3AF"
                    value={newAddressState}
                    onChangeText={setNewAddressState}
                    onFocus={() => setShowStateSuggestions(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        if (addFormScrollInProgressRef.current) return;
                        if (stateSuggestionTapInProgressRef.current) {
                          stateSuggestionTapInProgressRef.current = false;
                          return;
                        }
                        const currentStateValue = latestStateValueRef.current;
                        const resolvedState = resolveFullNameFromOptions(
                          currentStateValue,
                          stateOptions
                        );
                        if (resolvedState && resolvedState !== currentStateValue.trim()) {
                          prevStateSelectionRef.current = resolvedState
                            .trim()
                            .toLowerCase();
                          setNewAddressState(resolvedState);
                        }
                        setShowStateSuggestions(false);
                      }, 220);
                    }}
                  />
                  {enableFullAddressApi ? (
                    statesLoading ? (
                      <Text style={styles.deliveryCityHint}>
                        Loading states...
                      </Text>
                    ) : filteredStateSuggestions.length > 0 ? (
                      <View style={styles.deliveryCitySuggestionBox}>
                        {filteredStateSuggestions.map((state) => (
                          <TouchableOpacity
                            key={state}
                            style={styles.deliveryCitySuggestionItem}
                            activeOpacity={0.75}
                            onPressIn={() => {
                              applyStateSuggestion(state);
                            }}
                            onPress={() => {
                              applyStateSuggestion(state);
                            }}
                          >
                            <Text style={styles.deliveryCitySuggestionText}>
                              {state}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null
                  ) : null}

                  <Text style={styles.deliveryFormLabelRef}>
                    Pincode <Text style={styles.deliveryRequiredMark}>*</Text>
                  </Text>
                  <TextInput
                    style={styles.deliveryFormInputRef}
                    placeholder="6-digit pincode"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={newAddressPincode}
                    onChangeText={setNewAddressPincode}
                    onFocus={() => setShowPincodeSuggestions(true)}
                    onBlur={() => {
                      setTimeout(() => {
                        if (pincodeSuggestionTapInProgressRef.current) {
                          pincodeSuggestionTapInProgressRef.current = false;
                          return;
                        }
                        setShowPincodeSuggestions(false);
                      }, 220);
                    }}
                  />
                  {enableFullAddressApi ? (
                    filteredPincodeSuggestions.length > 0 ? (
                      <View style={styles.deliveryCitySuggestionBox}>
                        {filteredPincodeSuggestions.map((pincode) => (
                          <TouchableOpacity
                            key={pincode}
                            style={styles.deliveryCitySuggestionItem}
                            activeOpacity={0.75}
                            onPressIn={() => {
                              applyPincodeSuggestion(pincode);
                            }}
                            onPress={() => {
                              applyPincodeSuggestion(pincode);
                            }}
                          >
                            <Text style={styles.deliveryCitySuggestionText}>
                              {pincode}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : pincodeFoundFromApi === false ? (
                      <Text style={styles.deliveryCityHint}>
                        Pincode not found.
                      </Text>
                    ) : pincodeFoundFromApi === true ? (
                      <Text style={styles.deliveryCityHint}>
                        Pincode found.
                      </Text>
                    ) : null
                  ) : null}

                  {enableFullAddressApi ? (
                    <>
                      <Text style={styles.deliveryFormLabelRef}>
                        Country <Text style={styles.deliveryRequiredMark}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.deliveryFormInputRef}
                        placeholder="Select country"
                        placeholderTextColor="#9CA3AF"
                        value={newAddressCountry}
                        onChangeText={setNewAddressCountry}
                        onFocus={() => setShowCountrySuggestions(true)}
                        onBlur={() => {
                          setTimeout(() => {
                            if (countrySuggestionTapInProgressRef.current) {
                              countrySuggestionTapInProgressRef.current = false;
                              return;
                            }
                            setShowCountrySuggestions(false);
                          }, 220);
                        }}
                      />
                      {countriesLoading ? (
                        <Text style={styles.deliveryCityHint}>
                          Loading countries...
                        </Text>
                      ) : filteredCountrySuggestions.length > 0 ? (
                        <View style={styles.deliveryCitySuggestionBox}>
                          {filteredCountrySuggestions.map((country) => (
                            <TouchableOpacity
                              key={country}
                              style={styles.deliveryCitySuggestionItem}
                              activeOpacity={0.75}
                              onPressIn={() => {
                                applyCountrySuggestion(country);
                              }}
                              onPress={() => {
                                applyCountrySuggestion(country);
                              }}
                            >
                              <Text style={styles.deliveryCitySuggestionText}>
                                {country}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      ) : null}

                      <Text style={styles.deliveryFormLabelRef}>Address type</Text>
                      <View style={styles.deliveryTypeRow}>
                        {(
                          [
                            { key: "home" as const, label: "Home" },
                            { key: "work" as const, label: "Work" },
                            { key: "other" as const, label: "Other" },
                          ] as const
                        ).map(({ key, label }) => {
                          const active = newAddressType === key;
                          return (
                            <TouchableOpacity
                              key={key}
                              style={[
                                styles.deliveryTypeChip,
                                active && styles.deliveryTypeChipActive,
                              ]}
                              onPress={() => setNewAddressType(key)}
                              activeOpacity={0.85}
                            >
                              <Text
                                style={[
                                  styles.deliveryTypeChipText,
                                  active && styles.deliveryTypeChipTextActive,
                                ]}
                              >
                                {label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <View style={styles.deliverySwitchRow}>
                        <Text style={styles.deliverySwitchLabel}>
                          Set as default address
                        </Text>
                        <Switch
                          value={newAddressIsDefault}
                          onValueChange={setNewAddressIsDefault}
                          trackColor={{ false: "#E5E7EB", true: "#FDBA74" }}
                          thumbColor={newAddressIsDefault ? "#F97316" : "#f4f3f4"}
                        />
                      </View>
                    </>
                  ) : null}

                  <Text style={styles.deliveryFormLabelRef}>
                    Username{" "}
                    <Text style={styles.deliveryFormOptionalRef}>(optional)</Text>
                  </Text>
                  <TextInput
                    style={styles.deliveryFormInputRef}
                    placeholder="Choose a username"
                    placeholderTextColor="#9CA3AF"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={newAddressUsername}
                    onChangeText={setNewAddressUsername}
                  />

                  <View style={styles.deliveryFormActionsRow}>
                    <TouchableOpacity
                      style={styles.deliveryCancelOutlineButton}
                      activeOpacity={0.85}
                      onPress={goBackAddAddressForm}
                    >
                      <Text style={styles.deliveryCancelOutlineButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deliverySaveOrangeButton}
                      activeOpacity={0.85}
                      onPress={handleSaveNewAddress}
                    >
                      <Text style={styles.deliverySaveOrangeButtonText}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  locationPillOuter: {
    marginTop: 0,
    marginBottom: 0,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.45)",
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.96)",
  },
  locationPillText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    color: "#0F172A",
    fontWeight: "600",
    minWidth: 0,
  },
  /** Full-screen delivery picker so list + add form use full height; bottom stays scrollable. */
  deliveryModalRootFull: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  deliverySheetPage: {
    flex: 1,
    minHeight: 0,
  },
  deliverySheetBodyScroll: {
    flex: 1,
    minHeight: 0,
  },
  deliverySheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  deliverySheetTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
  },
  deliverySheetScroll: {
    paddingHorizontal: 18,
    paddingBottom: 28,
    flexGrow: 1,
  },
  deliverySheetScrollAdd: {
    paddingHorizontal: 18,
    paddingTop: 4,
    paddingBottom: 32,
    flexGrow: 1,
  },
  deliveryListLoading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    marginBottom: 8,
  },
  deliveryListLoadingText: {
    fontSize: 14,
    color: "#64748B",
  },
  deliverySearchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F3F3",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    marginBottom: 16,
  },
  deliverySearchInput: {
    flex: 1,
    fontSize: 15,
    color: "#333",
    paddingVertical: 0,
  },
  deliveryUseCurrentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  deliveryUseCurrentIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#ECEFF1",
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryUseCurrentTextCol: {
    flex: 1,
    minWidth: 0,
  },
  deliveryUseCurrentTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1976D2",
  },
  deliveryUseCurrentSub: {
    fontSize: 13,
    color: "#9E9E9E",
    marginTop: 2,
  },
  deliveryDividerDashed: {
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
    borderStyle: "dashed",
    marginBottom: 16,
  },
  deliverySavedHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  deliverySavedTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111",
  },
  deliveryAddNewText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1976D2",
  },
  deliveryAddHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    marginBottom: 14,
  },
  deliveryAddSheetTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
    marginHorizontal: 8,
  },
  deliveryAddKeyboardRoot: {
    flex: 1,
    minHeight: 0,
    backgroundColor: "#FFFFFF",
  },
  /** Reference-style add form: dark labels, bordered inputs, orange Save. */
  deliveryFormLabelRef: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 2,
  },
  deliveryFormOptionalRef: {
    fontWeight: "500",
    color: "#6B7280",
    fontSize: 13,
  },
  deliveryRequiredMark: {
    color: "#DC2626",
    fontWeight: "700",
  },
  deliveryFormInputRef: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 14,
  },
  deliveryFormActionsRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 10,
    marginTop: 8,
    marginBottom: 12,
  },
  deliverySaveOrangeButton: {
    backgroundColor: "#F97316",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 22,
    minWidth: 96,
    alignItems: "center",
  },
  deliverySaveOrangeButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  deliveryCancelOutlineButton: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 18,
    minWidth: 96,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D1D5DB",
  },
  deliveryCancelOutlineButtonText: {
    color: "#4B5563",
    fontSize: 15,
    fontWeight: "600",
  },
  deliveryAddressPhone: {
    fontSize: 13,
    color: "#1976D2",
    marginTop: 4,
    fontWeight: "500",
  },
  deliveryAddressCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#EEE",
    gap: 8,
  },
  deliveryAddressCardSelectArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    minWidth: 0,
  },
  deliveryAddressCardBody: {
    flex: 1,
    minWidth: 0,
  },
  deliveryAddressTypePill: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1565C0",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  deliveryDefaultBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deliveryDefaultBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2E7D32",
  },
  deliveryAddressDetailLine: {
    fontSize: 13,
    color: "#444",
    lineHeight: 18,
    marginTop: 2,
  },
  deliveryAddressDetailMeta: {
    fontSize: 13,
    color: "#666",
    marginTop: 4,
    lineHeight: 18,
  },
  deliveryAddressEmail: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
  deliveryAddressActionsCol: {
    alignItems: "flex-end",
    justifyContent: "flex-start",
    gap: 8,
    paddingTop: 2,
  },
  deliverySetDefaultBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#FDBA74",
    backgroundColor: "#FFF7ED",
  },
  deliverySetDefaultBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#C2410C",
  },
  deliveryAddressNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 4,
  },
  deliveryAddressName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#222",
    flexShrink: 1,
  },
  deliverySelectedBadge: {
    backgroundColor: "#D9ECFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  deliverySelectedBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#1565C0",
  },
  deliveryAddressLine: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
  deliveryAddressMenuBtn: {
    padding: 4,
    marginTop: -2,
  },
  deliveryCityHint: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: -6,
    marginBottom: 12,
  },
  deliveryCitySuggestionBox: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    marginTop: -6,
    marginBottom: 12,
    overflow: "hidden",
  },
  deliveryCitySuggestionItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E7EB",
  },
  deliveryCitySuggestionText: {
    fontSize: 14,
    color: "#1F2937",
  },
  deliveryTypeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 14,
  },
  deliveryTypeChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  deliveryTypeChipActive: {
    backgroundColor: "#FFF7ED",
    borderColor: "#F97316",
  },
  deliveryTypeChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4B5563",
  },
  deliveryTypeChipTextActive: {
    color: "#C2410C",
  },
  deliverySwitchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingVertical: 4,
  },
  deliverySwitchLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    flex: 1,
    marginRight: 12,
  },
});
