import { DateTime, UUID } from "../brand/types";
import { DateTime as DateTimeHelpers, UUID as UUIDHelpers } from "../brand/constructors";

/**
 * Base entity interface defining core properties all entities should have
 */
export interface IEntity {
    readonly id: UUID;
    readonly createdAt: DateTime;
    readonly updatedAt: DateTime;
}

/**
 * Serialized representation of an entity for persistence
 */
export interface SerializedEntity {
    readonly id: string;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

/**
 * Properties required for entity update operations
 */
export type IEntityForUpdate = Pick<IEntity, "updatedAt">;

/**
 * Abstract base entity class providing common functionality
 * for all domain entities using Effect for operations that may fail
 * # means private property in typescript
 */
export abstract class BaseEntity implements IEntity {
    #id: UUID;
    #createdAt: DateTime;
    #updatedAt: DateTime;

    protected constructor() {
        this.#id = UUIDHelpers.init();
        this.#createdAt = DateTimeHelpers.now();
        this.#updatedAt = this.#createdAt;
    }

    get id(): UUID {
        return this.#id;
    }

    get createdAt(): DateTime {
        return this.#createdAt;
    }

    get updatedAt(): DateTime {
        return this.#updatedAt;
    }

    /**
     * Mark the entity as updated with the current timestamp
     */
    protected markUpdated(): void {
        this.#updatedAt = DateTimeHelpers.now();
    }

    /**
     * Get the properties required for update operations
     */
    protected forUpdate(): IEntityForUpdate {
        return {updatedAt: this.#updatedAt};
    }

    /**
     * Copy base properties from another entity
     * Used for construction within safe boundaries of the domain
     */
    protected _copyBaseProps(other: IEntity): void {
        this.#id = other.id;
        this.#createdAt = DateTimeHelpers.fromTrusted(other.createdAt);
        this.#updatedAt = DateTimeHelpers.fromTrusted(other.updatedAt);
    }

    /**
     * Create an entity from a serialized representation
     * Returns an Effect that can succeed with the entity or fail with an error
     */
    protected _fromSerialized(other: Readonly<SerializedEntity>): this {
        this.#id = UUIDHelpers.fromTrusted(other.id);
        this.#createdAt = DateTimeHelpers.fromTrusted(other.createdAt);
        this.#updatedAt = DateTimeHelpers.fromTrusted(other.updatedAt);

        return this;
    }

    /**
     * Serialize the entity to a simple object
     * Returns an Effect that can succeed with the serialized entity or fail with an error
     */
    protected _serialize(): SerializedEntity {
        return {
            id: this.id,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * Serialize the entity to a simple object including all entity properties
     * Must be implemented by subclasses
     */
    serialize(): SerializedEntity {
        return this._serialize();
    }
}

