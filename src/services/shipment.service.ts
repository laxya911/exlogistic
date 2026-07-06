import { shipmentRepository } from '@/repositories/repository';
import { Shipment, ShipmentTimelineEvent, ShipmentStatus } from '@/types';

const STATUS_ORDER: ShipmentStatus[] = ['BOOKING', 'STUFFING', 'CUSTOMS', 'ON_VESSEL', 'TRANSIT', 'ARRIVED', 'DELIVERED', 'COMPLETED'];

class ShipmentService {
  /**
   * Returns the next logical status in the shipment pipeline.
   */
  nextStatus(current: ShipmentStatus | string): ShipmentStatus | null {
    let normalized = (current || '').toString().trim().toUpperCase();
    
    // Map any generic TransactionStatus to our logistics pipeline
    if (normalized === 'DRAFT') normalized = 'BOOKING';
    if (normalized === 'PENDING') normalized = 'STUFFING';
    if (normalized === 'CONFIRMED') normalized = 'CUSTOMS';
    if (normalized === 'SHIPPED') normalized = 'ON_VESSEL';
    if (normalized === 'IN_TRANSIT') normalized = 'TRANSIT';
    
    const idx = STATUS_ORDER.indexOf(normalized as ShipmentStatus);
    if (idx === -1 || idx === STATUS_ORDER.length - 1) return null;
    return STATUS_ORDER[idx + 1];
  }

  /**
   * Validate a shipment payload before create/update.
   */
  async validate(data: Partial<Shipment>, isUpdate: boolean): Promise<void> {
    const errors: string[] = [];

    if (!data.orderId) errors.push('Linked Sales Order is required');
    if (!data.shippingLineId) errors.push('Shipping Line is required');
    if (!data.originPortId) errors.push('Port of Loading (POL) is required');
    if (!data.destinationPortId) errors.push('Port of Discharge (POD) is required');
    if (!data.etd) errors.push('Estimated Time of Departure (ETD) is required');
    if (!data.eta) errors.push('Estimated Time of Arrival (ETA) is required');
    if (!data.containerType) errors.push('Container type is required');

    if (data.etd && data.eta) {
      if (new Date(data.eta) <= new Date(data.etd)) {
        errors.push('ETA must be after ETD');
      }
    }

    if (errors.length > 0) throw new Error(errors.join(' | '));
  }

  /**
   * Append a structured timeline event to a shipment.
   */
  logEvent(
    shipment: Shipment,
    type: ShipmentTimelineEvent['type'],
    title: string,
    description: string
  ): void {
    if (!shipment.timeline) shipment.timeline = [];
    shipment.timeline.unshift({
      id: `EV-${Math.random().toString(36).substr(2, 9)}`,
      date: new Date().toISOString(),
      type,
      title,
      description,
      userId: 'USR-001'
    });
  }

  /**
   * Advance shipment to the next pipeline stage.
   */
  async advance(id: string): Promise<Shipment> {
    const shipment = await shipmentRepository.getById(id);
    if (!shipment) throw new Error('Shipment not found');
    if (shipment.status === 'COMPLETED') throw new Error('Shipment is already completed');
    if (shipment.status === 'CANCELLED') throw new Error('Cannot advance a cancelled shipment');

    const next = this.nextStatus(shipment.status);
    if (!next) throw new Error(`No further status progression available for current status: '${shipment.status}'`);

    const stageTitles: Record<ShipmentStatus, string> = {
      BOOKING: 'Booking Confirmed',
      STUFFING: 'Container Stuffing Complete',
      CUSTOMS: 'Export Customs Cleared',
      ON_VESSEL: 'Cargo On Board — B/L Issued',
      TRANSIT: 'In Ocean Transit',
      ARRIVED: 'Vessel Arrived at Destination',
      DELIVERED: 'Cargo Delivered to Consignee',
      COMPLETED: 'Shipment File Closed',
      CANCELLED: 'Shipment Cancelled'
    };

    const stageDescs: Record<ShipmentStatus, string> = {
      BOOKING: 'Booking space confirmed with carrier.',
      STUFFING: 'Container stuffed at CFS. VGM declared. Seal applied.',
      CUSTOMS: 'Shipping Bill approved. Let Export Order (LEO) granted.',
      ON_VESSEL: 'Vessel departed. MBL and HBL issued.',
      TRANSIT: 'Vessel in transit. AIS tracking active.',
      ARRIVED: 'Vessel berthed at destination port. Import clearance initiated.',
      DELIVERED: 'Delivery Order surrendered. Cargo handed to consignee.',
      COMPLETED: 'All documents settled. Freight invoices closed.',
      CANCELLED: 'Shipment cancelled.'
    };

    shipment.status = next;
    if (next === 'ON_VESSEL' || next === 'TRANSIT') shipment.atd = shipment.atd || new Date().toISOString();
    if (next === 'ARRIVED' || next === 'DELIVERED' || next === 'COMPLETED') shipment.ata = shipment.ata || new Date().toISOString();

    this.logEvent(shipment, next, stageTitles[next], stageDescs[next]);
    const result = await shipmentRepository.update(id, shipment);
    return result as Shipment;
  }
}

export const shipmentService = new ShipmentService();
