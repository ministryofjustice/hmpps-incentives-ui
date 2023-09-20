import DpsComponentsClient, { AvailableComponent, Component } from '../data/dpsComponentsClient'

export default class FeComponentsService {
  constructor(private readonly dpsFeComponentsClient: DpsComponentsClient) {}

  public async getComponent(component: AvailableComponent, token: string): Promise<Component> {
    return this.dpsFeComponentsClient.getComponent(component, token)
  }
}
