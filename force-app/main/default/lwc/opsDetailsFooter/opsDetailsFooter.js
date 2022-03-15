import { LightningElement, api } from 'lwc';
import DESC from '@salesforce/schema/Opportunity.Order_Comments__c'
export default class OpsDetailsFooter extends LightningElement {
    @api recordId;
    @api objectApiName;
    @api prop1;
    @api flexipageRegionWidth;
    fields =[DESC]
}