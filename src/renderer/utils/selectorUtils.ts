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

  const parts = selector.split('!');
  let mainPart = parts[parts.length - 1];
  const sheetPart = parts.length > 1 ? parts.slice(0, -1).join('!') : '';

  if (sheetPart.startsWith('Sheet:')) {
    result.sheetName = sheetPart.substring('Sheet:'.length);
  }

  // Process tokens in document order to preserve condition ordering.
  // Pseudo-selectors are lowercase-only (:active, :dirty) — uppercase (:A1, :Active) are identifiers.
  const tokenRegex = /(\[[^\]]+\])|(:[a-z][a-z0-9_-]*)/g;
  const conditions: NonNullable<ParsedGridSelector['conditions']> = [];

  let tokenMatch;
  while ((tokenMatch = tokenRegex.exec(mainPart)) !== null) {
    if (tokenMatch[1]) {
      const parsed = parseAttributeConditions(tokenMatch[1]);
      if (parsed) conditions.push(...parsed);
    } else {
      conditions.push({ attribute: tokenMatch[2].substring(1), operator: '=', value: 'true' });
    }
  }

  // Remove all tokens to get the core element string
  let corePart = mainPart.replace(tokenRegex, '').trim();

  // Handle compound selectors like "Col:A Cell[...]" — take the first element token
  const spaceIdx = corePart.indexOf(' ');
  if (spaceIdx !== -1) {
    corePart = corePart.substring(0, spaceIdx).trim();
  }

  const coreElementRegex = /^(?<elementType>Cell|Range|Col|Row|Sheet)(?::(?<identifier>.*))?$/;
  const coreMatch = corePart.match(coreElementRegex);

  if (coreMatch?.groups) {
    result.elementType = coreMatch.groups.elementType as any;
    const identifier = coreMatch.groups.identifier || undefined;
    // For standalone Sheet:Name (no !), the identifier is the sheet name
    if (result.elementType === 'Sheet' && identifier) {
      result.sheetName = identifier;
    } else {
      result.identifier = identifier;
    }
  } else if (conditions.length > 0) {
    result.elementType = 'Cell';
  } else {
    console.warn('Invalid Gridpark selector syntax:', selector);
    return result;
  }

  if (conditions.length > 0) {
    result.conditions = conditions;
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
