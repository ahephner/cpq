
import { LightningElement, api, track } from 'lwc';

export default class MobileProducts extends LightningElement {
    toggleIcon = 'utility:edit';
    @track prod = [] 
    @track backUp = []
    loaded = false; 
    _data
    @api
    get products(){
        return this._data || [];
    }

    set products(data = []){
        if(Array.isArray(data)){
            this._data = data;
            this.load(this._data);
        }else{
            this_data = [];
        }
    }
     
    connectedCallback(){
        //this.load(this.products);
       // this.load(this.prod); 
    }
    
    load(data){
        console.log('in function ')
        this.backUp = data; 
        console.log('back up '+this.backUp);
        let x = data.map(x => {console.log(x);
            return {...x}
        })
        console.log('bigx '+x);
        
        let readOnly;
        let icon;  
        this.prod = data.map(rec=>{
            readOnly = true;
            icon = 'utility:edit'

        return{...rec, readOnly}
        })
        
    }
    edit(e){
        let index = this.prod.findIndex(x=>x.Id === e.target.name)
        this.prod[index].readOnly = false;
        // let curIcon = this.prod[index].icon
        // console.log(curIcon)
        // if(curIcon ==='utility:edit'){
        //     curIcon = 'utility:close';
        // }else{
        //     curIcon = 'utility:edit';
        // }
        //need to do more in here like show a delete button. 

    }

    //Handle value changes
    handleQty(qty){
        let index = this.prod.findIndex(prod => prod.Id === qty.target.name);
        this.prod[index].Quantity = Number(qty.detail.value);
        //handle total price change
        if(this.prod[index].UnitPrice > 0){
            this.prod[index].TotalPrice = this.prod[index].Quantity * this.prod[index].UnitPrice; 
        }
    }

    handlePrice(p){
        window.clearTimeout(this.delay);
        let index = this.prod.findIndex(prod => prod.Id === p.target.name);
        this.delay = setTimeout(()=>{
            this.prod[index].UnitPrice = Number(p.detail.value);
            if(this.prod[index].UnitPrice > 0){
                this.prod[index].Margin_Percent__c = Number((1-(this.prod[index].Cost__c /this.prod[index].UnitPrice))*100).toFixed(2)
                this.prod[index].TotalPrice = this.prod[index].Quantity * this.prod[index].UnitPrice;
            }
        },500)
    }

    handleMargin(m){
        //window.clearTimeout(this.delay)
        let index = this.prod.findIndex(prod => prod.Id === m.target.name);
        console.log('index '+index);
        
        this.delay = setTimeout(()=>{
            this.prod[index].Margin_Percent__c = Number(m.detail.value);
            let cost = this.prod[index].Cost__c;
            let num = (1- this.prod[index].Margin_Percent__c/100)
            if(num > 0){
                this.prod[index].UnitPrice = (cost/num).toFixed(2);
                this.prod[index].TotalPrice = this.prod[index].Quantity * this.prod[index].UnitPrice;
            }
            
            
            // if((1- (this.prod[index].Margin_Percent__c/100)) > 0){
            //     this.prod[index].UnitPrice = Number(this.prod[index].Cost__c / (1- this.selection[index].Margin_Percent__c/100)).toFixed(2)
            //     console.log('up '+ this.prod[index].UnitPrice);
                
            // }
        },500)
    }

    saveMobile(){
        const promise = this.prod.slice().map(draft =>{
            let Id = draft.Id;
            let Quantity = draft.Quantity;
            let UnitPrice = draft.UnitPrice;
            let Margin_Percent__c = draft.Margin_Percent__c;
        })
    }
}