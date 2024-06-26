import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DiscoveryService, ModuleRef } from '@nestjs/core';
import { MetadataAccessor, MetadataWrapper } from '@purrfect-tools/common';

import { METADATA_PROJECTION } from '../../constants';
import { EventStoreProjection, EventStoreProjectionDescriptor } from '../../types';

@Injectable()
export class EventStoreProjectionSubsystemExplorer implements OnModuleInit {
  private readonly logger = new Logger(EventStoreProjectionSubsystemExplorer.name);

  constructor(
    private readonly moduleRef: ModuleRef,
    private readonly discoveryService: DiscoveryService,

    private readonly metadataAccessor: MetadataAccessor,
  ) {}

  readonly projections: MetadataWrapper<EventStoreProjection, EventStoreProjectionDescriptor>[] = [];

  isValidService(instance: EventStoreProjection) {
    const hasQuery = 'getQuery' in instance;

    if (!hasQuery) {
      const serviceName = (instance as unknown).constructor.name;
      this.logger.warn(
        `The service '${serviceName}' won't be auto-loaded, '${serviceName}' doesn't implement 'EventStoreProjection' interface properly.`,
      );
    }

    return hasQuery;
  }

  onModuleInit() {
    this.projections.push(
      ...this.metadataAccessor
        .mapToMetadataWrapper<EventStoreProjection, EventStoreProjectionDescriptor>(
          this.discoveryService.getProviders(),
          METADATA_PROJECTION,
        )
        .filter(({ instance }) => this.isValidService(instance)),
    );

    this.logger.debug(
      `${this.projections.length} projections were found using the '${METADATA_PROJECTION}' metadata tag`,
    );

    Object.freeze(this.projections);
  }
}
