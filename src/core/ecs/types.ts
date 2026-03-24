export type ComponentType = string;

export interface Component {
  type: ComponentType;
  entity?: Entity;
}

export type EntityId = number;

export interface Entity {
  id: EntityId;
  components: Map<ComponentType, Component>;
  active: boolean;
}
