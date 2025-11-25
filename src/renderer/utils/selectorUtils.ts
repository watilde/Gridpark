// src/renderer/utils/selectorUtils.ts

export type ParsedGridSelector = {
  sheetName?: string; // e.g., "MyData" or "Active"
  elementType?: 'Sheet' | 'Cell' | 'Range' | 'Col' | 'Row';
  identifier?: string; // e.g., "A1", "A1:B2", "A", "1"
  conditions?: Array<{
    attribute: string; // e.g., "value", "type", "formula"
    operator: string; // e.g., "=", "^=", "*=", "~=", "<", ">"
    value: string; // e.g., "Total", "number"
  }>;
  selectorString?: string; // The original selector string for full context, especially for pseudo-selectors
};

/**
 * Parses a Gridpark Semantic Selector string into a structured object.
 *
 * Examples:
 * - "Sheet:MyData!Cell:A1"
 * - "Cell:A1" (assumes active sheet)
 * - "Range:A1:B2"
 * - "Sheet:Products!Col:B"
 * - "Row:1"
 * - "Cell[value="Total"]"
 * - "Col:A Cell[value^="Product"]"
 * - "Sheet:Summary!Cell[type="number"][value<100]"
 */
export const parseGridSelector = (selector: string): ParsedGridSelector => {
  const result: ParsedGridSelector = { selectorString: selector };

  const parts = selector.split('!'); // Split by '!' for sheet part

  let mainPart = parts[parts.length - 1]; // Assume last part is element + identifier + conditions
  const sheetPart = parts.length > 1 ? parts.slice(0, -1).join('!') : '';

  if (sheetPart.startsWith('Sheet:')) {
    result.sheetName = sheetPart.substring('Sheet:'.length);
  }

  // Separate pseudo-selectors from main part
  const pseudoSelectorRegex = /(:[a-zA-Z0-9_-]+)/g; // Captures :active, :dirty etc.
  const pseudoSelectors: string[] = [];
  mainPart = mainPart.replace(pseudoSelectorRegex, match => {
    pseudoSelectors.push(match);
    return ''; // Remove from mainPart for further parsing
  });

  // Separate attribute conditions from main part
  const attributeConditionRegex = /(\[[^\]]+\])/g; // Captures [value="Total"] etc.
  let attributeConditionsString = '';
  mainPart = mainPart.replace(attributeConditionRegex, match => {
    attributeConditionsString += match;
    return ''; // Remove from mainPart for further parsing
  });

  // Now parse the core element type and identifier
  const coreElementRegex = /^(?<elementType>Cell|Range|Col|Row|Sheet)(?::(?<identifier>.*))?$/;
  const coreMatch = mainPart.match(coreElementRegex);

  if (coreMatch?.groups) {
    result.elementType = coreMatch.groups.elementType as any;
    result.identifier = coreMatch.groups.identifier || undefined;
  } else if (attributeConditionsString || pseudoSelectors.length > 0) {
    // If no explicit element type, but conditions or pseudo-selectors, assume 'Cell'
    result.elementType = 'Cell';
  } else {
    console.warn(`Invalid Gridpark selector syntax: "${selector}"`);
    return result;
  }

  if (attributeConditionsString) {
    result.conditions = parseAttributeConditions(attributeConditionsString);
  }

  // Convert pseudo-selectors to conditions
  if (pseudoSelectors.length > 0) {
    if (!result.conditions) result.conditions = [];
    pseudoSelectors.forEach(ps => {
      const attr = ps.substring(1); // Remove leading ':'
      result.conditions?.push({ attribute: attr, operator: '=', value: 'true' }); // Treat as boolean attribute
    });
  }

  return result;
};

/**
 * Parses attribute condition strings like "[value="Total"][type="number"]"
 * into an array of condition objects.
 */
const parseAttributeConditions = (conditionsString: string): ParsedGridSelector['conditions'] => {
  const conditions: ParsedGridSelector['conditions'] = [];
  const conditionRegex =
    /\[(?<attribute>[^=<>~^$*]+)(?<operator>=|\|=|\^=|\$=|\*=|\~=)?(?:"(?<value>[^"]*)"|(?<numberValue>\d+(?:\.\d+)?))?\]/g;

  let match;
  while ((match = conditionRegex.exec(conditionsString)) !== null) {
    const { attribute, operator, value, numberValue } = match.groups as {
      attribute: string;
      operator?: string;
      value?: string;
      numberValue?: string;
    };

    const conditionValue = value ?? numberValue;

    if (attribute && conditionValue !== undefined) {
      conditions.push({
        attribute,
        operator: operator || '=',
        value: conditionValue,
      });
    } else if (attribute && !operator && conditionValue === undefined) {
      // Handle boolean attributes like [active] (though spec uses [active="true"])
      conditions.push({
        attribute,
        operator: '=',
        value: 'true',
      });
    }
  }
  return conditions;
};
