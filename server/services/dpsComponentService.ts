import DpsComponentsClient, { AvailableComponent, Component } from '../data/dpsComponentsClient'

export default class DpsComponentService {
  // eslint-disable-next-line
  constructor(private readonly dpsFeComponentsClient: DpsComponentsClient) {}

  public async getComponent(component: AvailableComponent, token: string): Promise<Component> {
    return this.dpsFeComponentsClient.getComponent(component, token)
  }
}
