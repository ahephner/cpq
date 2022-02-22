import { LightningElement, api, wire, track } from 'lwc';
import ACCID from '@salesforce/schema/Opportunity.AccountId';
import SHIPID from '@salesforce/schema/Opportunity.Shipping_Address__c'
import {getRecord, getFieldValue, updateRecord } from 'lightning/uiRecordApi';
import Opportunity_Builder from '@salesforce/messageChannel/Opportunity_Builder__c';
import getAddress from '@salesforce/apex/cpqApex.getAddress'
import { MessageContext, publish} from 'lightning/messageService';
export default class ContactAddress extends LightningElement {
        @api recordId; 
        customer;
        selected; 
       // @track selectObj;
        @track options;
        isRendered = false;   
        error;
        showAddresses = true; 
    //Subscribe to Message Channel
    @wire(MessageContext)
    messageContext; 

        @wire(getRecord, {recordId: '$recordId', fields:[ACCID, SHIPID]})
            custFields({data, error}){
                if(data){
                    this.customer = getFieldValue(data,ACCID);
                    this.findAddress(this.customer)
                    this.selected = getFieldValue(data, SHIPID);
                }else if(error){
                    this.error = error;
                }
            }

        findAddress(rec){
             getAddress({accID: rec})
                .then((res)=>{
                   
                    
                    this.options = res.map(item=>({
                                        ...item,
                                        label: item.Street +' ('+item.Name+')',
                                        value: item.Id
                    }))
                    console.log('type of options '+typeof this.options);
                    console.log(JSON.stringify(this.options))
                }).catch((error)=>{
                    this.error = error;
                    console.log('error  '+this.error);
                    
                }).finally(()=>{
                
                })
        }
//if a ship to has already been selected set that value
//note as of now it puts the same option twice in the drop downs. 
            get selectedObj(){
                let label;
                    if(this.options && this.selected){
                        label = this.options.find((x)=>x.value===this.selected)
                    }
                    
                    return label;   
            }

           
        selectChange(event){
            let newValue = this.template.querySelector('.slds-select').value;
            if(newValue === "new"){
                this.template.querySelector('c-new-ship-address').openAddress(); 
            }else{
                const payLoad = {shipAddress: newValue};
                //send to main comp
                publish(this.messageContext,Opportunity_Builder, payLoad);

            }
        }

        updateAddress(event){
            console.log(event);
            
            let value = event.detail.value;
            
            let label = event.detail.label;
            let x = {value, label, selected}
            // this.options.push(x); 
            console.log(x)
            
        }
        order(valueSelected){
            
            //let z = this.template.querySelector('.slds-select').value;
            console.log( valueSelected);
            
            
        }
}