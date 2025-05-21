export interface JHipsterField {
  fieldName: string;
  fieldType: string;
  fieldValues?: string;
  fieldValidateRules?: string[];
  fieldIsEnum?: boolean;
  fieldTypeBoolean?: boolean;
  fieldTypeBinary?: boolean;
  fieldTypeString?: boolean;
  fieldTypeLocalDate?: boolean;
  fieldTypeZonedDateTime?: boolean;
  fieldTypeInstant?: boolean;
}

export interface JHipsterRelationship {
  relationshipName: string;
  otherEntityName: string;
  relationshipType: string;
  relationshipSide?: 'left' | 'right';
  otherEntityRelationshipName?: string;
  otherEntityField?: string;
  otherEntityFieldMapping?: string;
}

export interface JHipsterEntity {
  name: string;
  fields: JHipsterField[];
  relationships?: JHipsterRelationship[];
  pagination?: 'pagination' | 'infinite-scroll' | 'no';
  applicationType?: string;
  dto?: string;
  service?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}
