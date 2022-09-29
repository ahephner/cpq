import { LightningElement, api, track } from 'lwc';
import FORM_FACTOR from '@salesforce/client/formFactor';
import { FlowNavigationNextEvent, FlowNavigationBackEvent,FlowAttributeChangeEvent  } from 'lightning/flowSupport';
import { updateRecord } from 'lightning/uiRecordApi';

export default class ProductMaintFlowFloor extends LightningElement{

    formSize; 
    loading = true; 
    lowRecordsCount; 
    lowRecords; 
    items;
    error; 
    @api flexipageRegionWidth;
    @track final
    @track itemsList;
    @api label; 
    @api defaultMargin; 
    @api 
    get pbeList(){
        return this.items ||[];
    } 
    set pbeList(data){
        this.items = data; 
        this.onStart();
    }
    //Going to see if I can replace the connectedcallback
    //it's showing the items from the load
    async onStart(){
        //bet we will need a shallow copy to allow me to write over
        this.formSize = await this.screenSize(FORM_FACTOR);
        this.items = await this.setFloor(this.defaultMargin);
        this.itemsList = [...this.items.backList];
        // this.lowRecords = [...results.floorsLow]; 
        // this.lowRecordsCount = results.count; 
        this.loading = false; 
        }
    //connectedCallback(){
    //    this.formSize = this.screenSize(FORM_FACTOR);
    //}
    screenSize = (screen)=>{
        return screen === 'Large'? true:false;
    }

    //set the new floor here. 
    setFloor(numb){
        let lowFloor = [];
        let lowFloorCount = 0;
        let divider = 1 - (numb/100);
        let prevFloor; 
        let valChanged; 
        let color; 
        let updateList = this.items.map(x=>{ 
                prevFloor = x.Floor_Price__c;
                valChanged;
                color;  
                return {...x, prevFloor, valChanged, color}
            })

        for(let i = 0; i< updateList.length; i ++){
            if(!updateList[i].Agency__c){
                updateList[i].Floor_Price__c = this.roundNum(updateList[i].Product_Cost__c / divider, 2); 
                updateList[i].Min_Margin__c  = this.defaultMargin; 
                updateList[i].valChanged = this.roundNum(updateList[i].Floor_Price__c - updateList[i].prevFloor, 2);
                updateList[i].color = updateList[i].valChanged >= 0 ? 'slds-text-color_success' : 'slds-text-color_error';  
                    if(updateList[i].Level_1_Price__c < updateList[i].Floor_Price__c){
    //I want to set some sort of class here that we can use then to add color to the row. 
                        lowFloor.push(updateList[i]);
                        lowFloorCount ++; 
                    }
            }
        }
        return {backList:updateList, floorsLow: lowFloor, count: lowFloorCount}; 
    }

    //Delete from list
    removeRow(e){
        let index = this.itemsList.findIndex(i => i.Id === e.target.name);
        if(index <= 0){
            this.itemsList.splice(index, 1); 
        }
    
    } 
    //returns a round number for later math functions
    roundNum = (value, dec)=>{
        //console.log('v '+value+' dec '+dec)
        return Number(Math.round(parseFloat(value+'e'+dec))+'e-'+dec)
    }

    //move screen
    handleSave(){
        this.loading = true; 
        const inputs = this.itemsList.slice().map(draft=>{
            
            let Id = draft.Id;
            let Min_Margin__c = draft.Min_Margin__c;
            let isChanged__c = true; 
            const fields = {Id, Min_Margin__c, isChanged__c}
            return {fields}
        })
        const promises = inputs.map(rec => updateRecord(rec));
        console.log(inputs)
        Promise.all(promises).then(x=>{
            let mess = 'success';
            const attributeChange = new FlowAttributeChangeEvent('label', mess);
            this.dispatchEvent(attributeChange);
            this.next(); 
        }).catch(err=>{
            this.error = err;
            const attributeChange = new FlowAttributeChangeEvent('label', this.error);
            this.dispatchEvent(attributeChange)
        }).finally(()=>{
            this.loaded = true; 
        })

    }
    next(){
        const moveNext = new FlowNavigationNextEvent();
        this.dispatchEvent(moveNext);
    }
    handleCancel(){
        this.loading = true; 
        const moveBack = new FlowNavigationBackEvent();
        this.dispatchEvent(moveBack); 
    }
}