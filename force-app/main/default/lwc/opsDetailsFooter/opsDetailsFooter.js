import { LightningElement, api } from 'lwc';
import DESC from '@salesforce/schema/Opportunity.Description'
export default class OpsDetailsFooter extends LightningElement {
    @api recordId;
    @api objectApiName;

    fields =[DESC]
}