import { LightningElement, api } from 'lwc';
import LightningAlert from 'lightning/alert';
export default class DataTemplate extends LightningElement {
    @api name;
    @api atsScore;
    @api profitability;
    @api invScore;
    @api progScore;
    @api focusProduct;
    messLine = `${this.name} - Score: ${this.atsScore}`
    async handleAlertClick() {
        await LightningAlert.open({
            message: `${this.name} - Score: ${this.atsScore}`,
            theme: 'shade', // a red theme intended for error states
            label: 'Score!', // this is the header text
        });
        //Alert has been closed
    }
}