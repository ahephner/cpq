import { LightningElement, api } from 'lwc';
import { FlowNavigationNextEvent,FlowAttributeChangeEvent, FlowNavigationBackEvent  } from 'lightning/flowSupport';
import { updateRecord } from 'lightning/uiRecordApi';
import ID_Field from '@salesforce/schema/Opportunity.Id';
import STAGE from '@salesforce/schema/Opportunity.StageName';
export default class PdfButtons extends LightningElement {
    @api oppId; 
    @api pdfString;
    address
    loaded; 
    connectedCallback(){ 
        this.loaded = true;
    }
    handleString(){ 
        this.pdfString = 'apex/APXTConga4__Conga_Composer?SolMgr=1&serverUrl={!API.Partner_Server_URL_370}';
        this.pdfString += '&Id='+this.oppId
        this.pdfString += '&QueryId=[OppLineItem]0Q_006EAE438384,[OppLineItem2]0Q_008EAE308702,[OppLineItem3]0Q_009EAE356924';
        this.pdfString += '&TemplateId=0T_020EAE678015&SC0=1&DS2=1&DS3=1&DS4=1&DS5=1&DS6=1&DS7=401&DefaultPDF=1&FP0=1&AC0=1'
        this.pdfString += '&DC={!IF(OR(ISPICKVAL(Opportunity.StageName, "Closed Won"),ISPICKVAL(Opportunity.StageName, "Quote")), "0", "1")}&OFN=Advanced+Turf+Solutions+-+{!Opportunity.Account_Name_Text__c}+-+Quote+{!Opportunity.Quote_Number_Text__c}&SF1=1'
       // return this.pdfString;  
    }
    moveNext(){ 
        this.loaded = false; 
        this.handleString();
       
        const fields = {}
        fields[ID_Field.fieldApiName] = this.oppId;
        fields[STAGE.fieldApiName] = 'Quote'
        const opp = {fields}
        console.log('starting');
        
        updateRecord(opp)
            .then(()=>{
                try {
                    console.log('back');
                    
                    this.dispatchEvent(new FlowAttributeChangeEvent('pdfString', this.pdfString));
                    
                    this.goNext(); 
                    
                } catch (error) {
                    console.log(error)
                }
                this.loaded = true; 
            })
            .catch(error=>{ 
                alert(JSON.stringify(error));
                this.loaded = true; 
            })
    }
    
    goNext(){ 
        const nextNav = new FlowNavigationNextEvent();
        this.dispatchEvent(nextNav); 

    }
}