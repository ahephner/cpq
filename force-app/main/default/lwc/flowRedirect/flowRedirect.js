import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
export default class FlowRedirect extends NavigationMixin(LightningElement){
    @api goToRecordId; 
    
    connnectedCallback(){
        this.navigateToOppPage(); 
    }
    navigateToOppPage() {
        console.log('id passed in '+ this.goToRecordId);
        
        this[NavigationMixin.Navigate]({
            type: 'standard__recordPage',
            attributes: {
                recordId: this.goToRecordId,
                objectApiName: 'Opportunity',
                actionName: 'view'
            }
        });
 }
}