# Part Keyword Mappings

## 🎯 **Comprehensive Keyword Detection System**

The system now uses an intelligent keyword mapping system that recognizes various manufacturer terminologies and automatically maps them to the correct part names in your system.

### 📋 **Available Parts & Keywords**

#### **1. Radiator**
Maps to: `Radiator`

**Recognized Keywords:**
- `radiator`
- `cooler for coolant` ✅ (your example)
- `cooling radiator`
- `engine cooler`
- `coolant radiator`
- `water radiator`
- `cooling module`
- `heat exchanger`

**Examples:**
- Toyota: "Cooler for Coolant" → Maps to **Radiator**
- VW: "Cooling Radiator" → Maps to **Radiator**
- Ford: "Engine Cooler" → Maps to **Radiator**

---

#### **2. Left Headlamp**
Maps to: `Left Headlamp`

**Recognized Keywords:**
- `left headlight`
- `left headlamp`
- `left front light`
- `left head lamp`
- `lh headlight`
- `lh headlamp`
- `driver side headlight`
- `driver headlight`
- `headlamp left`
- `headlight left`

**Examples:**
- BMW: "LH Headlight" → Maps to **Left Headlamp**
- Mercedes: "Driver Side Headlight" → Maps to **Left Headlamp**
- Audi: "Left Front Light" → Maps to **Left Headlamp**

---

#### **3. Right Headlamp**
Maps to: `Right Headlamp`

**Recognized Keywords:**
- `right headlight`
- `right headlamp`
- `right front light`
- `right head lamp`
- `rh headlight`
- `rh headlamp`
- `passenger side headlight`
- `passenger headlight`
- `headlamp right`
- `headlight right`

**Examples:**
- BMW: "RH Headlight" → Maps to **Right Headlamp**
- Mercedes: "Passenger Side Headlight" → Maps to **Right Headlamp**
- Honda: "Right Front Light" → Maps to **Right Headlamp**

---

#### **4. Condenser**
Maps to: `Condenser`

**Recognized Keywords:**
- `condenser`
- `ac condenser`
- `air conditioning condenser`
- `a/c condenser`
- `aircon condenser`
- `cooling condenser`
- `refrigerant condenser`

**Examples:**
- Toyota: "A/C Condenser" → Maps to **Condenser**
- Ford: "Air Conditioning Condenser" → Maps to **Condenser**
- Nissan: "Cooling Condenser" → Maps to **Condenser**

---

#### **5. Intercooler**
Maps to: `Intercooler`

**Recognized Keywords:**
- `intercooler`
- `charge air cooler` ✅ (common VW term)
- `turbo cooler`
- `air charge cooler`
- `charged air cooler`
- `turbo intercooler`
- `boost cooler`

**Examples:**
- VW: "Charge Air Cooler" → Maps to **Intercooler**
- Audi: "Charged Air Cooler" → Maps to **Intercooler**
- BMW: "Turbo Intercooler" → Maps to **Intercooler**

---

#### **6. Fan Assembly**
Maps to: `Fan Assembly`

**Recognized Keywords:**
- `fan assembly`
- `cooling fan`
- `radiator fan`
- `engine fan`
- `fan motor`
- `cooling fan assembly`
- `radiator fan assembly`
- `electric fan`

**Examples:**
- Honda: "Cooling Fan Assembly" → Maps to **Fan Assembly**
- Toyota: "Radiator Fan" → Maps to **Fan Assembly**
- Ford: "Electric Fan" → Maps to **Fan Assembly**

---

#### **7. Radar Sensor**
Maps to: `Radar Sensor`

**Recognized Keywords:**
- `radar sensor`
- `parking sensor`
- `proximity sensor`
- `distance sensor`
- `ultrasonic sensor`
- `park assist sensor`
- `pdc sensor`

**Examples:**
- BMW: "PDC Sensor" → Maps to **Radar Sensor**
- Mercedes: "Park Assist Sensor" → Maps to **Radar Sensor**
- Audi: "Ultrasonic Sensor" → Maps to **Radar Sensor**

---

### 🔄 **Smart Fallback Logic**

#### **Generic Headlight Detection**
If the system detects these generic terms without left/right specification:
- `headlight`
- `headlamp`
- `head lamp`
- `front light`

**Default Behavior:** Maps to **Left Headlamp** (user can manually change to Right if needed)

---

### 🎯 **How It Works**

1. **Image Upload:** User pastes screenshot with text like "Cooler for Coolant"
2. **Text Extraction:** Google Vision API extracts all text
3. **Keyword Matching:** System searches for matching keywords
4. **Exact Mapping:** Maps "Cooler for Coolant" → "Radiator"
5. **Auto-Selection:** Automatically selects "Radiator" in the parts list
6. **Part Number:** Also extracts and fills the part number field

### 💡 **Case Insensitive Matching**

All keyword matching is **case insensitive**, so these all work:
- `COOLER FOR COOLANT` ✅
- `Cooler For Coolant` ✅  
- `cooler for coolant` ✅
- `Cooler for coolant` ✅

### 🚀 **Adding New Keywords**

To add new keywords, simply update the `partKeywordMapping` object in:
`src/utils/googleVisionApi.ts`

**Example:** To add "Water Cooler" as a Radiator keyword:
```javascript
'Radiator': [
  'radiator',
  'cooler for coolant',
  'water cooler', // ← Add new keyword here
  // ... existing keywords
],
```

### 🎉 **Real-World Examples**

**Toyota Screenshot:** "Cooler for Coolant 98364837GD"
- ✅ Maps to: **Radiator**
- ✅ Part Number: **98364837GD**

**VW Screenshot:** "Charge Air Cooler ABC123456"
- ✅ Maps to: **Intercooler** 
- ✅ Part Number: **ABC123456**

**BMW Screenshot:** "LH Headlight 63117182518"
- ✅ Maps to: **Left Headlamp**
- ✅ Part Number: **63117182518**

The system is now ready to handle all major manufacturer terminologies! 🔥 